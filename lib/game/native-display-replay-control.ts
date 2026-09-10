import {initializeOriginalReplayResources} from './replay-resource-initialization.ts';
import {selectOriginalReplayControl} from './replay-control-selection.ts';
import {drawOriginalReplayBarDisplay} from './replay-bar-display.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
/** Replay controls over independently allocated display resources. Live input
 * state remains in the simulation; display caches and pointers stay local. */
export function createNativeDisplayReplayControl(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,live:()=>Uint8Array,liveD=0x2d1a0){
 const {mode,d,drawing}=owner,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],low={cga:0x5da,tandy:0x616,ega:0x462}[mode];
 return (operation:number,first:number,current:number)=>{
  const target=owner.memory();
  if(operation===0){initializeOriginalReplayResources(target,d,mode);return;}
  if(operation===2){selectOriginalReplayControl(target,d,first,mode);return;}
  if(operation===4)return;
  if(operation!==1)throw Error('Replay input polling belongs to the race controller');
  const memory=live();
  for(const [at,length,delta] of [[0x12f,1,0],[0x31e9,1,0],[0x8fd8,2,high],[0xa034,2,high],[0x5524,9,low]])target.set(memory.subarray(liveD+at,liveD+at+length),d+at+delta);
  restoreOriginalDisplayWindow(target,d,mode);
  target[d+0x897c+high]=mode==='ega'?target[d+0x5638]:0;
  drawOriginalReplayBarDisplay(target,d,mode,{...drawing,selectBackBuffer(){target[d+0x131]=0;},selectFrontBuffer(){target[d+0x131]=1;}},first,current);
  memory[liveD+0x31e9]=target[d+0x31e9];
 };
}
