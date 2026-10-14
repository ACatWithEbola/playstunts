import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {fixtureData} from './global-score-fixture.ts';
test('cancelled in-race load preserves recording and identity while clearing original score eligibility',async()=>{
 for(const [physicsEngine,framesPerSecond] of [['ms-1990',20],['ms-1991',20],['ms-1991',10]] as const){
  const memory=Uint8Array.from({length:0x100000},(_,i)=>i&255),d=0x2d1a0;
  memory[d+0x8018]=1;const expected=memory.slice();expected[d+0x8018]=0;
  const raw=[7,8,9],opponentPath=[1,2],audioWrites:number[][][]=[];
  const runtime={session:{physicsEngine,framesPerSecond,state:{memory},originalMemory:{writeMemory(){assert.fail('Cancel must not replace allocated memory');}}},audio:{produce(){return [[0x330,0x90]];}},raw,opponentPath,trackAddress:0x60000} as unknown as Parameters<typeof loadAllocatedReplay>[1];
  const result=await loadAllocatedReplay(fixtureData,runtime,{
   async selectReplay(getMemory){assert.equal(getMemory(),memory);return 0;},
   async readReplay(){assert.fail('Cancelled selection must not read a recording');},
   replayPhysicsEngine(){assert.fail('Cancelled selection must not resolve a replacement engine');},
   replayFramesPerSecond(){assert.fail('Cancelled selection must not resolve a replacement cadence');},
   showWaiting(){assert.fail('Cancelled selection must not show loading');},progress(){assert.fail('Cancelled selection must not prepare resources');},
   writeAudio(writes){audioWrites.push(writes);},
  });
  assert.equal(result,undefined);assert.deepEqual(memory,expected);
  assert.equal(runtime.session.physicsEngine,physicsEngine);assert.equal(runtime.session.framesPerSecond,framesPerSecond);
  assert.deepEqual(raw,[7,8,9]);assert.deepEqual(opponentPath,[1,2]);assert.deepEqual(audioWrites,[[[0x330,0x90]]]);
 }
});
test('in-race10 loading rejects before reading or replacing the recording bank',async()=>{
 const memory=new Uint8Array(0x100000),d=0x2d1a0,trackAddress=0x60000;
 const view=new DataView(memory.buffer);
 view.setUint16(d+0x9356,0,true);view.setUint16(d+0x9358,trackAddress/16,true);
 memory.fill(37,0x70000,0x73000);
 const bank=memory.slice(0x70000,0x73000);
 let read=0,written=0;
 const runtime={session:{state:{memory},originalMemory:{writeMemory(){written++;}}},audio:{produce(){return [];}},raw:[],opponentPath:null,trackAddress} as unknown as Parameters<typeof loadAllocatedReplay>[1];
 await assert.rejects(()=>loadAllocatedReplay(fixtureData,runtime,{
  async selectReplay(){return 1;},async readReplay(){read++;return null;},
  replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){},
 }),/10 Hz replay loading/);
 await assert.rejects(()=>loadAllocatedReplay(fixtureData,runtime,{
  async selectReplay(){return 1;},async readReplay(){read++;return null;},
  replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){},
 }),/10 Hz replay loading/,'Explicit MS91 still requires the experimental opt-in');
 await assert.rejects(()=>loadAllocatedReplay({...fixtureData,experimental10Hz:true},runtime,{
  async selectReplay(){return 1;},async readReplay(){read++;return null;},
  replayPhysicsEngine(){return 'ms-1990';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){},
 }),/10 Hz replay loading/,'Experimental opt-in must not enable legacy10 Hz playback');
 assert.equal(read,0);assert.equal(written,0);
 assert.deepEqual(memory.slice(0x70000,0x73000),bank);
});
