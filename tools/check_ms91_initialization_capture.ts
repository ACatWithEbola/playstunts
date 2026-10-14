import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {packVersionedRaceSnapshot} from '../lib/game/versioned-race-snapshot.ts';
import {readMs91BodyCaches,writeMs91BodyCaches,initialMs91BodyCaches} from '../lib/game/ms91-body-cache-memory.ts';
import {initializeRaceSession} from '../lib/game/initialize-race-session.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
import {trackRoutePoint,trackOpponentRoutePoint} from '../lib/physics/track-route-point.ts';
const [image,libraries,path,game,cars,testCar,modeArg]=process.argv.slice(2);assert.ok(image&&libraries&&path&&game&&cars);
const source=readFileSync(path);let testSource=new Uint8Array(source),testPath=path;
if(testCar){
 assert.ok(fixtureData.cars.some((car:{id:string})=>car.id===testCar)&&/^[A-Z0-9]{4}$/.test(testCar));
 assert.equal(source[6],0,'All-car initialization fixture must have no opponent');
 testSource=testSource.slice();testSource.set(new TextEncoder().encode(testCar),0);
 testPath=join(mkdtempSync(join(tmpdir(),'ms91-init-car-')),'INITIAL.RPL');writeFileSync(testPath,testSource,{flag:'wx'});
}
const decoded=decodeVersionedReplay(testSource,'ms-1991'),replay=decoded.bytes,rate=decoded.framesPerSecond;
const car=String.fromCharCode(...replay.subarray(0,4)),opponent=String.fromCharCode(...replay.subarray(7,11));
const args=['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',testPath,'--game',game,'--analyze','--car',join(cars,'CAR'+car+'.RES'),'--position','690432','0','805760','--chassis-step','--driving-step','0','--recorded-inputs','--driving-steps','1','--race-init','--full-player','--update-race'];
if(replay[6])args.push('--opponent-car',join(cars,'CAR'+opponent+'.RES'),'--opponent-resource',join(cars,'OPP'+replay[6]+'.PRE'));
const runtime=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:rate,...(rate===10?{experimental10Hz:true}:{})},{configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'INITIALIZE',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
runtime.session.skipIntroduction();let memory=runtime.session.state.memory;const d=0x2d1a0;
if(modeArg!==undefined){
 const mode=Number(modeArg);assert.ok([-2,-1,0].includes(mode));
 memory=memory.slice();new DataView(memory.buffer).setUint16(d+0x8daa,321,true);
 const seeded=packVersionedRaceSnapshot(memory.subarray(d+0x8ae6,d+0x8ae6+1072),'ms-1991',readMs91BodyCaches(memory,d,rate));
 const seedPath=join(mkdtempSync(join(tmpdir(),'ms91-init-mode-')),'SEED.BIN');writeFileSync(seedPath,seeded,{flag:'wx'});
 args.push('--race-init-mode',String(mode),'--race-state-input',seedPath);
 const data=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const}),raw=Array.from(replay.subarray(24,0x722)),prepared=prepareRaceTrack(raw,data.records,data.vectors,data.samples,data.objects),before=memory;
 const initialized=initializeRaceSession(before,d,before.slice(d+0xa46a,d+0xa46a+776),before.slice(d+0x9c52,d+0x9c52+776),{...prepared.start,transmission:replay[5],mode,opponentSelected:replay[6],opponentPath:runtime.opponentPath??[],framesPerSecond:rate,physicsEngine:'ms-1991'},(entry,point,opponent)=>opponent?trackOpponentRoutePoint(raw,prepared.route,entry,point,data.records,data.points,data.objects,data.indices,before.subarray(d+0x9362,d+0x9362+511)):trackRoutePoint(raw,prepared.route,entry,point,data.records,data.points,data.objects));
 memory=writeMs91BodyCaches(initialized.memory,d,rate,initialMs91BodyCaches(initialized.memory,d));
}
const run=spawnSync('python3',args,{encoding:'utf8',maxBuffer:12000000});assert.equal(run.status,0,run.stderr);
const expected=Buffer.from(JSON.parse(run.stdout).chassis.initialRaceSnapshot,'hex');assert.equal(expected.length,1120);
const actual=packVersionedRaceSnapshot(memory.subarray(d+0x8ae6,d+0x8ae6+1072),'ms-1991',readMs91BodyCaches(memory,d,rate));
const differences=[];for(let i=0;i<1120;i++)if(actual[i]!==expected[i]&&differences.length<20)differences.push({offset:i,actual:actual[i],original:expected[i]});
assert.equal(differences.length,0,'Initial snapshot differences '+JSON.stringify(differences));
assert.deepEqual(readFileSync(path),source);
console.log(JSON.stringify({car,opponentEnabled:!!replay[6],rate,mode:modeArg===undefined?0:Number(modeArg),initialBytesCompared:1120,sourceUnchanged:true,pass:true}));
