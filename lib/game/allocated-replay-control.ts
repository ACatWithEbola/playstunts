import {initializeOriginalReplayResources} from './replay-resource-initialization.ts';
import {selectOriginalReplayControl} from './replay-control-selection.ts';
import {drawOriginalReplayBarMemory} from './replay-bar-memory-raster.ts';
/** Original replay modes0/1/2/4 over the actual loaded banks. Display caches
 * remain in the renderer; selection and input state remain in the live race. */
export function createAllocatedReplayControl(live:()=>Uint8Array,rendering:()=>Uint8Array,d:number){
 return (mode:number,first:number,current:number)=>{
  const m=live();
  if(mode===0){initializeOriginalReplayResources(m,d);return;}
  if(mode===2){selectOriginalReplayControl(m,d,first);return;}
  if(mode===4)return;
  if(mode!==1)throw Error('Replay input polling belongs to the race controller');
  const target=rendering();
  for(const [at,length] of [[0x12f,1],[0x31e9,1],[0x897c,1],[0x8fd8,2],[0xa034,2],[0x54c8,92],[0x5524,9]])target.set(m.subarray(d+at,d+at+length),d+at);
  drawOriginalReplayBarMemory(target,d,first,current);m[d+0x31e9]=target[d+0x31e9];
 };
}
