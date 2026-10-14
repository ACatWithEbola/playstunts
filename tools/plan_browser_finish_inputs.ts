/** Offline rehearsal; optional new-file-only QA replay export. Never a
 * substitute for fresh browser evidence or a public score submission. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeSaveBackup} from '../lib/game/save-backup.ts';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession,createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {encodeVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
const [backupPath,key,mode,gainText='1.5',limitText='150']=process.argv.slice(2);
const gain=Number(gainText),wheelLimit=Number(limitText);
const cadence=process.argv.includes('--20hz')?20:10;
const cautious=process.argv.includes('--cautious');
const exportArgument=process.argv.find(arg=>arg.startsWith('--export-replay='));
const exportPath=exportArgument?.slice('--export-replay='.length);
if(exportPath){assert.ok(isAbsolute(exportPath)&&/\.RPL$/i.test(exportPath),'Export requires a new absolute .RPL path');assert.equal(mode,'autopilot');assert.ok(process.argv.includes('--require-victory'),'Export requires opponent-winning rehearsal');}
const speedArgument=process.argv.find(arg=>arg.startsWith('--target-speed='));
const targetSpeed=speedArgument?Number(speedArgument.split('=')[1]):cautious?3600:7200;
assert.ok(Number.isFinite(targetSpeed)&&targetSpeed>0&&targetSpeed<=24000,'Invalid rehearsal target speed');
assert.ok(gain>0&&gain<=4&&wheelLimit>0&&wheelLimit<=240,'Invalid rehearsal steering parameters');
assert.ok(backupPath&&key,'Provide a backup and exact replay key');
const before=readFileSync(backupPath),backup=decodeSaveBackup(before.toString());
const file=backup.files.find(file=>file.key===key);assert.ok(file);
assert.equal(file.physicsEngine,'ms-1991');
assert.ok((file.framesPerSecond??20)===10||(file.framesPerSecond??20)===20);
if(mode==='recorded')assert.equal(file.framesPerSecond??20,cadence);
const bytes=file.bytes;
const configuration=Array.from(bytes.slice(0,24));
if(process.argv.includes('--opponent-victory')){
 configuration.splice(0,4,...Array.from('PMIN',c=>c.charCodeAt(0)));
 configuration[5]=1;configuration[6]=1;
 configuration.splice(7,4,...Array.from('LM02',c=>c.charCodeAt(0)));
 configuration[12]=0;
}
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:cadence,experimental10Hz:cadence===10},
 {configuration,track:Array.from(bytes.slice(24,0x722)),name:'QA_LOOP',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
const initialPose=structuredClone(race.session.state.player.driving.car.pose);
const runs:{input:number;frames:number}[]=[];
const samples:unknown[]=[];
const waypoints=[[690432,950272],[950272,950272],[950272,690432],[690432,690432],[cadence===20?700000:690432,850000]];
let waypoint=0;
let heldInput=0;
const stride=mode==='recorded'?1:2;
for(let frame=0;frame<(mode==='autopilot'?240*cadence:Math.ceil((bytes.length-0x722)/stride));frame++){
 let input=bytes[0x722+frame*stride];
 if(mode==='autopilot'&&frame%5===0){
  const car=race.session.state.player.driving.car;
  let target=waypoints[waypoint];
  if(Math.hypot(target[0]-car.pose.position[0],target[1]-car.pose.position[2])<(cautious?7000:12000)&&waypoint<waypoints.length-1)target=waypoints[++waypoint];
  const desired=Math.atan2(-(target[0]-car.pose.position[0]),target[1]-car.pose.position[2])*1024/(2*Math.PI);
  const error=((desired-car.pose.rotation[0]+1536)%1024)-512;
  const wheel=Math.max(-wheelLimit,Math.min(wheelLimit,-error*gain));
  input=(car.engine.speed<targetSpeed?1:car.engine.speed>targetSpeed+(cautious?400:800)?2:0)|(wheel>car.grip.steeringAngle+10?4:wheel<car.grip.steeringAngle-10?8:0);
  heldInput=input;
 }
 if(mode==='autopilot')input=heldInput;
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input,cadence,'ms-1991');
 race.session.originalMemory.writeMemory(race.session.state.memory);
 race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 if(frame===24||frame===40)samples.push({frame,pose:structuredClone(race.session.state.player.driving.car.pose),speed:race.session.state.player.driving.car.engine.speed});
 if(runs.at(-1)?.input===input)runs.at(-1)!.frames++;else runs.push({input,frames:1});
 if(mode==='autopilot'&&readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel.playerTime)break;
}
assert.deepEqual(readFileSync(backupPath),before);
let reloadVerified=false;
let exportedReplay:{path:string;bytes:number;sha256:string}|undefined;
const jitterChecks:{seed:number;finishTicks:number}[]=[];
if(mode==='autopilot'){
 const panel=readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel;
 assert.ok(panel.playerTime>0,`Rehearsal must reach a native finish: ${JSON.stringify({cadence,waypoint,position:race.session.state.player.driving.car.pose.position,panel})}`);
 if(process.argv.includes('--require-victory'))assert.ok(panel.opponentSelected&&(!panel.opponentTime||panel.playerTime<=panel.opponentTime),`Rehearsal must actually beat the opponent: ${JSON.stringify(panel)}`);
 let saved:Uint8Array|undefined;
 await race.session.saveReplay(async bytes=>{saved=bytes.slice();return 0;});
 assert.ok(saved);
 const external=encodeVersionedReplay(saved,'ms-1991',cadence),decoded=decodeVersionedReplay(external,'ms-1991');
 assert.equal(decoded.framesPerSecond,cadence);assert.deepEqual(decoded.bytes,saved);
 const loaded=await createNativeReplayRaceSession({...fixtureData,physicsEngine:'ms-1990',experimental10Hz:true},
  {configuration:Array.from(saved.slice(0,24)),track:Array.from(saved.slice(24,0x722)),name:'QA_LOOP',camera:0,graphics:2,soundEnabled:false},
  {bytes:saved,name:'REHEARSE',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:cadence},{resetMouse(){},async key(){return 0;}});
 assert.equal(loaded.session.physicsEngine,'ms-1991');assert.equal(loaded.session.framesPerSecond,cadence);
 loaded.session.seek(0);loaded.session.seek(loaded.session.length);
 assert.deepEqual(loaded.session.state.player.driving.car,race.session.state.player.driving.car);
 reloadVerified=true;
 if(exportPath){
  writeFileSync(exportPath,external,{flag:'wx'});
  assert.deepEqual(Uint8Array.from(readFileSync(exportPath)),external);
  exportedReplay={path:exportPath,bytes:external.length,sha256:createHash('sha256').update(external).digest('hex')};
 }
 if(process.argv.includes('--jitter'))for(const seed of [0,1,2]){
  const trial=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:cadence,experimental10Hz:cadence===10},
   {configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'QA_LOOP',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
  trial.session.skipIntroduction();
  for(const [index,run] of [...runs,{input:0,frames:100}].entries()){
   const frames=Math.max(1,run.frames+[0,1,-1][(index+seed)%3]);
   for(let frame=0;frame<frames;frame++){
    captureOriginalRaceInput(trial.session.state.memory,0x2d1a0,run.input,cadence,'ms-1991');
    trial.session.originalMemory.writeMemory(trial.session.state.memory);
    trial.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
   }
  }
  jitterChecks.push({seed,finishTicks:readOriginalRaceResultMemory(trial.session.state.memory,0x2d1a0).panel.playerTime});
 }
}
console.log(JSON.stringify({offlineOnly:true,mode,cadence,waypoint,initialPose,samples,finalPose:race.session.state.player.driving.car.pose,panel:readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel,
 position:race.session.state.player.driving.car.pose.position,reloadVerified,exportedReplay,jitterChecks,runCount:runs.length,runs:process.argv.includes('--runs')?runs:undefined}));
