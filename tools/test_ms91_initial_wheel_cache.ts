import assert from 'node:assert/strict';
import {initializeRaceSession} from '../lib/game/initialize-race-session.ts';
import {playerStartPosition} from '../lib/physics/start-position.ts';
import {opponentStartPosition} from '../lib/physics/opponent-start-position.ts';
const d=0x20000,memory=new Uint8Array(0x100000);
const tuning=new Uint8Array(776);
memory.fill(0x7d,d,d+65536);
// Isolate checkpoint storage from the retained data segment.
const view=new DataView(memory.buffer);view.setUint16(d+0xa030,0,true);view.setUint16(d+0xa032,0x6000,true);
const source=memory.slice(),lookup=()=>({midpoint:[0,0,0],first:[0,0,0],second:[0,0,0],alternate:0,side:0});
let cases=0;
for(const angle of [0,256,512,768])for(const hill of [0,1] as const)for(const transmission of [0,1])for(const fps of [10,20] as const){
 const setup={column:10,row:17,angle,hill,transmission,mode:-1,opponentSelected:1,opponentPath:[0],framesPerSecond:fps};
 const legacy=initializeRaceSession(memory,d,tuning,tuning,setup,lookup);
 assert.deepEqual(initializeRaceSession(memory,d,tuning,tuning,{...setup,physicsEngine:'ms-1990'},lookup),legacy,'Explicit legacy must equal prior default');
 const modern=initializeRaceSession(memory,d,tuning,tuning,{...setup,physicsEngine:'ms-1991'},lookup);
 const modernView=new DataView(modern.memory.buffer,modern.memory.byteOffset,modern.memory.byteLength);
 const permitted=new Set<number>();
 // Original MS91 919C additionally clears the previous-route word9494.
 // Assert both exact versions rather than allowing arbitrary extra writes.
 assert.equal(modernView.getUint16(d+0x8daa,true),0);
 assert.equal(new DataView(legacy.memory.buffer).getUint16(d+0x8daa,true),0x7d7d);
 permitted.add(d+0x8daa);permitted.add(d+0x8dab);
 for(const [base,position] of [[0x8c38,playerStartPosition(10,17,angle,hill).position],[0x8cf0,opponentStartPosition(10,17,angle,hill).position]] as const){
  for(let wheel=0;wheel<4;wheel++)for(let axis=0;axis<3;axis++){
   const at=d+base+0x74+wheel*6+axis*2;
   assert.equal(modernView.getInt16(at,true),position[axis]>>6);
   permitted.add(at);permitted.add(at+1);
  }
 }
 for(let at=0;at<modern.memory.length;at++)if(modern.memory[at]!==legacy.memory[at])assert.ok(permitted.has(at),'Unexpected modern initialization write at '+at.toString(16));
 assert.deepEqual(memory,source,'Initialization must not mutate caller');cases++;
}
assert.equal(cases,32);
console.log('MS91 wheel caches and previous-route reset match across32 full-memory cases; legacy/default and all unrelated bytes stay identical');
