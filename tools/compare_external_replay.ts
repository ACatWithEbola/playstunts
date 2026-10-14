/** Read-only differential replay harness. No database or network writes. */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {opponentPose} from '../lib/physics/opponent-pose.ts';
import {opponentTargetAngle} from '../lib/physics/opponent-target-angle.ts';
import {opponentSelectTarget} from '../lib/physics/opponent-select-target.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
import {readMs91BodyCaches,writeMs91BodyCaches,decodeMs91BodyCache,encodeMs91BodyCache} from '../lib/game/ms91-body-cache-memory.ts';
const [replayPath,dumpPath,version,inspectFrame,comparisonMode,seedEvidencePath]=process.argv.slice(2);
if(comparisonMode&&!['--accepted-prefix','--no-finish-expected'].includes(comparisonMode))throw Error('Unsupported comparison mode');
if(!replayPath||!dumpPath)throw Error('Usage: node tools/compare_external_replay.ts LEGACY_REPLAY EXTERNAL_DUMP');
const source=new Uint8Array(readFileSync(replayPath)),dump=new Uint8Array(readFileSync(dumpPath));
// Normalize only in memory for the legacy allocator. Never rewrite the source.
const sv=new DataView(source.buffer,source.byteOffset,source.byteLength);
const modern=source.length===0x724+sv.getUint16(24,true);
const engine=resolvePhysicsEngine(version);
const decoded=modern?decodeVersionedReplay(source,engine):{bytes:source,framesPerSecond:20 as const};
const replay=decoded.bytes,framesPerSecond=decoded.framesPerSecond;
if(framesPerSecond===10&&engine!=='ms-1991')throw Error('Test-only10 Hz full replay comparison requires MS91');
const rv=new DataView(replay.buffer,replay.byteOffset,replay.byteLength),dv=new DataView(dump.buffer,dump.byteOffset,dump.byteLength);
const frames=rv.getUint16(22,true);
const comparisonData=versionedRouteTables({...fixtureData,physicsEngine:engine});
const prepared=prepareRaceTrack(Array.from(replay.slice(24,0x722)),comparisonData.records,comparisonData.vectors,comparisonData.samples,comparisonData.objects);
const referenceFrames=dv.getUint16(0,true);
if(replay.length!==0x722+frames||dump.length!==2+1120*referenceFrames||!frames||
 (comparisonMode==='--accepted-prefix'?referenceFrames<frames:referenceFrames!==frames))throw Error('Unexpected replay or dump layout');
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:engine,framesPerSecond,...(framesPerSecond===10?{experimental10Hz:true}:{})},{configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'COMPARE',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
if(seedEvidencePath){
 const evidence=JSON.parse(readFileSync(seedEvidencePath,'utf8'));
 assert.equal(evidence.testOnly,true);assert.equal(evidence.frames,referenceFrames);
 const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(evidence.captureSha256,hash(dump));assert.equal(evidence.replaySha256,hash(source));
 assert.equal(evidence.initialParticleRandom.length,6);
 assert.ok(evidence.initialParticleRandom.every((value:number)=>Number.isInteger(value)&&value>=0&&value<256));
 // Match the captured original initial state only in this isolated comparator.
 // This does not change startup assets, production RNG, or any replay bytes.
 let memory=race.session.state.memory.slice();memory.set(evidence.initialParticleRandom,0x2d1a0+0x9f5c);
 if(evidence.testPlayerPosition){
  assert.equal(engine,'ms-1991');assert.equal(comparisonMode,'--no-finish-expected','Synthetic placement must not certify a finish');
  assert.equal(evidence.testPlayerPosition.length,3);
  const v=new DataView(memory.buffer),at=0x2d1a0+0x8c38,delta=evidence.testPlayerPosition.map((value:number,axis:number)=>value-v.getInt32(at+axis*4,true));
  assert.ok(delta.every((value:number)=>Number.isInteger(value)&&value%64===0));
  for(const base of [0,12])for(let axis=0;axis<3;axis++)v.setInt32(at+base+axis*4,v.getInt32(at+base+axis*4,true)+delta[axis],true);
  for(let point=0;point<4;point++)for(let axis=0;axis<3;axis++){const p=at+0x74+point*6+axis*2;v.setInt16(p,v.getInt16(p,true)+delta[axis]/64,true);}
  const caches=readMs91BodyCaches(memory,0x2d1a0,framesPerSecond);
  caches[0]=encodeMs91BodyCache(decodeMs91BodyCache(caches[0]).map(point=>point.map((value,axis)=>value+delta[axis]/64) as [number,number,number]));
  memory=writeMs91BodyCaches(memory,0x2d1a0,framesPerSecond,caches);
 }
 race.session.originalMemory.writeMemory(memory);
}
if(inspectFrame)console.log(JSON.stringify({initialParticleRandom:race.session.state.player.driving.particles.random}));
let firstDifference:number|undefined,differingFrames=0;
const stateDifferences:Record<string,{firstFrame:number;count:number}>={};
for(let i=0;i<frames;i++){
 const priorOpponent=race.session.state.opponent.car,priorPlayer=race.session.state.player.driving.car;
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,replay[0x722+i],framesPerSecond,engine);
 race.session.originalMemory.writeMemory(race.session.state.memory);
 race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 const car=race.session.state.player.driving.car,o=2+i*1120;
 if(inspectFrame&&i+1===Number(inspectFrame))console.log(JSON.stringify({particleFrame:i+1,random:race.session.state.player.driving.particles.random,nativeParticles:race.session.state.player.driving.particles.particles.slice(0,3),originalParticles:Array.from({length:3},(_,slot)=>({owner:dump[o+0x95e3-0x91a0+slot],speed:dv.getInt16(o+0x952e-0x91a0+slot*2,true),verticalSpeed:dv.getInt16(o+0x955e-0x91a0+slot*2,true),heading:dv.getInt16(o+0x94fe-0x91a0+slot*2,true)}))}));
 const externalPosition=[0,4,8].map(k=>dv.getInt32(o+338+k,true));
 const nativePosition=Array.from(car.pose.position);
 const externalSurfaces=Array.from(dump.subarray(o+338+194,o+338+198));
 if(car.grip.surfaces.some((surface,w)=>surface!==externalSurfaces[w])){
  const entry=stateDifferences.surfaces??={firstFrame:i+1,count:0};entry.count++;
 }
 const memory=race.session.state.memory,mv=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 if(engine==='ms-1991'){
  for(let index=0;index<48;index++)if(memory[0x2d1a0+0x8eb0+index]!==dump[o+0x959a-0x91a0+index]){
   const entry=stateDifferences.signMarkers??={firstFrame:i+1,count:0};entry.count++;
  }
  if(memory[0x2d1a0+0x8ee0]!==dump[o+0x95ca-0x91a0]){const entry=stateDifferences.particleActive??={firstFrame:i+1,count:0};entry.count++;}
  for(let slot=0;slot<24;slot++){
   const expectedSpeed=dv.getInt16(o+0x952e-0x91a0+slot*2,true),speed=mv.getInt16(0x2d1a0+0x8e44+slot*2,true);
   if(speed!==expectedSpeed){const entry=stateDifferences.particleSpeed??={firstFrame:i+1,count:0};entry.count++;}
   if(!speed&&!expectedSpeed)continue;
   for(const [native,original,size] of [[0x8ae6,0x91a0,4],[0x8b46,0x9200,4],[0x8ba6,0x9260,4],[0x8db4,0x949e,2],[0x8de4,0x94ce,2],[0x8e14,0x94fe,2],[0x8e74,0x955e,2],[0x8ee1,0x95cb,1],[0x8ef9,0x95e3,1]]){
    const at=0x2d1a0+native+slot*size,reference=o+original-0x91a0+slot*size;
    const actual=size===4?mv.getInt32(at,true):size===2?mv.getInt16(at,true):memory[at],expected=size===4?dv.getInt32(reference,true):size===2?dv.getInt16(reference,true):dump[reference];
    if(actual!==expected){const entry=stateDifferences['particleField'+native]??={firstFrame:i+1,count:0};entry.count++;}
   }
  }
  const caches=readMs91BodyCaches(memory,0x2d1a0,framesPerSecond);
  for(const index of replay[6]!==0?[0,1]:[0]){
   const expected=dump.subarray(o+338+208*index+140,o+338+208*index+164);
   if(caches[index].some((value,byte)=>value!==expected[byte])){
    const entry=stateDifferences['bodyCache'+index]??={firstFrame:i+1,count:0};entry.count++;
   }
  }
 }
 if(replay[6]!==0){
  const native=0x2d1a0+0x8cf0,external=o+546;
  if(inspectFrame&&i+1===Number(inspectFrame)){
   const pathAddress=mv.getUint16(0x2d1a0+0x7ff4,true)+16*mv.getUint16(0x2d1a0+0x7ff6,true),entry=mv.getUint16(pathAddress+2*race.session.state.opponent.route.routeIndex,true),tile=prepared.route.tiles[entry],direction=prepared.route.directions[entry];
   console.log(JSON.stringify({opponentDescriptorFrame:i+1,entry,tile,direction,record:comparisonData.records[tile].records[direction&15],points:comparisonData.points[tile].records[direction&15]}));
   const pose=opponentPose(priorOpponent.pose.position,priorPlayer.pose.position,priorOpponent.pose.rotation),target=race.session.state.opponent.routeTarget;
   const selected=opponentSelectTarget(target.midpoint,target.first,target.second,pose.position,pose.player,pose.matrix,0,priorPlayer.grip.crash);
   console.log(JSON.stringify({opponentDecisionFrame:i+1,pose,selected,angle:opponentTargetAngle(selected.target,pose.position,pose.matrix,true),wheelAngle:priorOpponent.grip.wheelAngle,sliding:priorOpponent.grip.sliding}));
  }
  for(const offset of [0x8c,0x8e,0x90,0x92,0x94,0x96,0x98,0x9a,0x9c])if(mv.getInt16(native+offset,true)!==dv.getInt16(external+offset+24,true)){
   const name='opponentRouteVector'+offset,entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
  if(inspectFrame&&Math.abs(i+1-Number(inspectFrame))<=1)console.log(JSON.stringify({opponentRouteFrame:i+1,routeIndex:[mv.getUint16(native+0x4a,true),dv.getUint16(external+0x4a,true)],point:[memory[native+0xb6],dump[external+0xb6+24]],native: [0x8c,0x8e,0x90,0x92,0x94,0x96,0x98,0x9a,0x9c].map(offset=>mv.getInt16(native+offset,true)),external:[0x8c,0x8e,0x90,0x92,0x94,0x96,0x98,0x9a,0x9c].map(offset=>dv.getInt16(external+offset+24,true)),rotation:[24,26,28].map(offset=>[mv.getInt16(native+offset,true),dv.getInt16(external+offset,true)])}));
  if(inspectFrame&&Math.abs(i+1-Number(inspectFrame))<=1)console.log(JSON.stringify({opponentFrame:i+1,nativePosition:[0,4,8].map(offset=>mv.getInt32(native+offset,true)),externalPosition:[0,4,8].map(offset=>dv.getInt32(external+offset,true)),nativeYaw:mv.getInt16(native+24,true),externalYaw:dv.getInt16(external+24,true),nativeSteering:mv.getInt16(native+32,true),externalSteering:dv.getInt16(external+32,true),engineWords:[34,42,44,66,68,70].map(offset=>({offset,native:mv.getUint16(native+offset,true),external:dv.getUint16(external+offset,true)})),targetSpeed:[memory[0x2d1a0+0x8eaf],dump[o+1017]],mode:[memory[0x2d1a0+0xa3c2],dump[o+1013]],accelerating:[memory[native+0xa5],dump[external+0xa5+24]]}));
  for(const offset of [0,4,8])if(mv.getInt32(native+offset,true)!==dv.getInt32(external+offset,true)){
   const name='opponentPosition'+offset,entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
  for(const offset of [24,26,28,30,32,34,42,44,54,62,64,68,70])if(mv.getUint16(native+offset,true)!==dv.getUint16(external+offset,true)){
   const name='opponentWord'+offset,entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
  for(const offset of [0xa4,0xa5,0xa6,0xa8,0xa9,0xaa,0xab,0xac,0xad,0xae,0xaf,0xb1,0xb2,0xb3,0xb4])if(memory[native+offset]!==dump[external+offset+24]){
   const name='opponentByte'+offset,entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
 }
 // The C serialized car adds24 bytes of body-corner vectors before these
 // byte fields. The native retained car layout does not contain that block.
 for(const [name,offset] of [['braking',0xa4],['accelerating',0xa5],['gear',0xa6],['rearContact',0xa8],['allContact',0xa9],['limiter',0xae],['sliding',0xaf],['crash',0xb1],['shifting',0xb2],['shiftTimer',0xb3],['automatic',0xb4]] as const){
  if(memory[0x2d1a0+0x8c38+offset]!==dump[o+338+offset+24]){
   const entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
 }
 // Compare persistent physics fields independently of allocator addresses.
 if(mv.getUint16(0x2d1a0+0x8c36,true)!==dv.getUint16(o+336,true)){
  const entry=stateDifferences.airborneTransitions??={firstFrame:i+1,count:0};entry.count++;
 }
 for(const carIndex of replay[6]!==0?[0,1]:[0])for(const [name,start,count] of [['suspensionRc1',0x4c,4],['suspensionRc2',0x54,4],['suspensionRc4',0x64,4],['suspensionRc5',0x6c,4],['wheelPositions',0x74,12]] as const){
  if(Array.from({length:count},(_,index)=>start+index*2).some(offset=>mv.getUint16(0x2d1a0+0x8c38+184*carIndex+offset,true)!==dv.getUint16(o+338+208*carIndex+offset,true))){
   const key=carIndex?'opponent'+name:name;
   const entry=stateDifferences[key]??={firstFrame:i+1,count:0};entry.count++;
  }
 }
 for(const [name,offset] of [['yaw',24],['pitch',26],['roll',28],['gravity',30],['steering',32],['rpm',34],['speed',42],['roadSpeed',44],['wheelAngle',54],['spin',62],['frontAngle',64],['demandedGrip',68],['surfaceGrip',70]] as const){
  if(mv.getUint16(0x2d1a0+0x8c38+offset,true)!==dv.getUint16(o+338+offset,true)){
   const entry=stateDifferences[name]??={firstFrame:i+1,count:0};entry.count++;
  }
 }
 const differs=nativePosition.some((n,k)=>n!==externalPosition[k]);
 if(inspectFrame&&Math.abs(i+1-Number(inspectFrame))<=1){
  const words=[];
  for(let offset=0;offset<208;offset+=2){const native=mv.getUint16(0x2d1a0+0x8c38+offset,true),external=dv.getUint16(o+338+offset,true);if(native!==external)words.push({offset,native,external});}
  const wheelTiles=car.wheelPositions?.map(p=>{const column=p[0]>>10,row=p[2]>>10;return {p,column,row,id:replay[24+row*30+column],terrain:replay[24+901+(29-row)*30+column]};});
  console.log(JSON.stringify({inspect:i+1,input:replay[0x722+i],externalSurfaces,wheelTiles,origins:car.contactOrigins,engine:car.engine,grip:car.grip,suspension:car.suspension,position:nativePosition,words}));
 }
 if(differs){differingFrames++;firstDifference??=i+1;}
 if(i+1===firstDifference||i===frames-1)console.log(JSON.stringify({frame:i+1,input:replay[0x722+i],nativePosition,externalPosition,nativeSteering:car.grip.steeringAngle,externalSteering:dv.getInt16(o+370,true),nativeYaw:car.pose.rotation[0],externalYaw:dv.getInt16(o+362,true),nativeSpeed:car.engine.roadSpeed,externalSpeed:dv.getUint16(o+382,true)}));
}
console.log(JSON.stringify({frames,framesPerSecond,firstPositionDifference:firstDifference??null,differingFrames,stateDifferences,nativeFinished:race.session.state.player.driving.car.grip.crash===3,externalFinish:dv.getUint16(2+(frames-1)*1120+322,true)}));
assert.equal(differingFrames,0,'Recorded race position diverged from reference');
assert.deepEqual(stateDifferences,{},'Recorded race physics fields diverged from reference');
if(seedEvidencePath){
 const evidence=JSON.parse(readFileSync(seedEvidencePath,'utf8'));
 assert.deepEqual(Array.from(race.session.state.memory.subarray(0x2d1a0+0x9f5c,0x2d1a0+0x9f62)),evidence.finalParticleRandom,'Final original/native RNG state');
 console.log(JSON.stringify({matchedCapturedInitialRng:true,finalRngMatches:true,testOnly:true}));
}
if(comparisonMode==='--no-finish-expected'){
 assert.notEqual(race.session.state.player.driving.car.grip.crash,3,'Incomplete probe must not gain a false finish');
 assert.equal(dv.getUint16(2+(frames-1)*1120+322,true),0,'Original incomplete probe must have no recorded finish');
 assert.equal(readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel.playerTime,0);
}else{
 assert.equal(race.session.state.player.driving.car.grip.crash,3,'Reference finish was not reproduced');
 assert.equal(dv.getUint16(2+(frames-1)*1120+322,true),readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel.playerTime,'Independent finish ticks must match the retained race result');
}
assert.deepEqual(new Uint8Array(readFileSync(replayPath)),source,'Source replay bytes changed during comparison');
