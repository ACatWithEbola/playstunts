import assert from 'node:assert/strict';
import {runBrowserAllocatedRaceLoop} from '../lib/game/browser-allocated-race-loop.ts';

// Exercise the production browser adapter. Rendering and audio output are
// explicit doubles: this verifies wiring, not audible output or browser pixels.
type Args=Parameters<typeof runBrowserAllocatedRaceLoop>;
for(const choice of [0,1,65535,'failure'] as const){
 const memory=new Uint8Array(0x100000),d=0x2d1a0,view=new DataView(memory.buffer),calls:string[]=[];
 memory[d+0xaa77]=1;memory[d+0x131]=7;memory[d+0x132]=1;
 view.setUint16(d+0x4090,123,true);view.setUint16(d+0x4ec2,4,true);
 const runtime={session:{state:{memory},resumeRecording(value:number){
  calls.push('choice:'+value);assert.equal(value,choice===1?1:0);
  assert.equal(memory[d+0x33aa],0);assert.equal(view.getUint16(d+0x4090,true),0);
  memory[d+0xaa77]=0;
 },async finishIteration(){calls.push('iteration');return 'exit';}},
 renderCockpitWorld(){},finishRenderedFrame(){},dialogAudio(value:string){calls.push(value);return value;},
 async finish(){calls.push('finish');}} as unknown as Args[0];
 const presentation={async nextFrame(){},presentWorld(){},hideCursor(){throw Error('Visible cursor must be restored');},
 async dialog(resource:string,mode:number,selected:number,border:number){
  calls.push('dialog');assert.equal(resource,'erbf');assert.equal(mode,2);assert.equal(selected,0);assert.equal(border,4);
  assert.equal(memory[d+0x33aa],1);
  if(choice==='failure')throw Error('Injected dialog failure');return choice;
 }} as unknown as Args[2];
 const run=()=>runBrowserAllocatedRaceLoop(runtime,{} as Args[1],presentation,{write(){}} as Args[3],{
  signal:new AbortController().signal,showWaiting(){},async loadReplay(){},
 });
 if(choice==='failure'){
  await assert.rejects(run,/Injected dialog failure/);
  assert.equal(memory[d+0xaa77],1);assert.ok(!calls.includes('iteration'));
 }else{
  await run();assert.equal(memory[d+0xaa77],0);
  assert.deepEqual(calls,['pause-audio','dialog','resume-audio','choice:'+(choice===1?1:0),'iteration','finish']);
 }
 assert.equal(memory[d+0x33aa],0);assert.equal(memory[d+0x131],7);assert.equal(memory[d+0x132],1);
 assert.equal(view.getUint16(d+0x4090,true),0);
}
console.log('Browser replay-limit adapter: three exits and dialog-failure cleanup pass; output services explicitly doubled');

// A genuinely asynchronous writer must hold the production loop at both
// modal boundaries, not merely be accepted by its type.
{
 const memory=new Uint8Array(0x100000),d=0x2d1a0;memory[d+0xaa77]=1;memory[d+0x132]=1;
 let release!:()=>void,dialog=false,resumed=false,finished=false,writes=0;
 const runtime={session:{state:{memory},resumeRecording(){resumed=true;memory[d+0xaa77]=0;},async finishIteration(){return 'exit';}},renderCockpitWorld(){},finishRenderedFrame(){},dialogAudio(){return [];},async finish(){finished=true;}} as unknown as Args[0];
 const presentation={async nextFrame(){},presentWorld(){},hideCursor(){},async dialog(){dialog=true;return 0;}} as unknown as Args[2];
 const pending=runBrowserAllocatedRaceLoop(runtime,{} as Args[1],presentation,{write(){writes++;return new Promise<void>(r=>release=r);}},{signal:new AbortController().signal,showWaiting(){},async loadReplay(){}});
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
 await flush();assert.equal(writes,1);assert.equal(dialog,false);assert.equal(resumed,false);
 release();await flush();assert.equal(dialog,true);assert.equal(writes,2);assert.equal(resumed,false);assert.equal(finished,false);
 release();await pending;assert.equal(resumed,true);assert.equal(finished,true);
}
console.log('Production browser recording dialog awaits asynchronous pause and resume delivery');
