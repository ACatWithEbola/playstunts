import {initializeOriginalReplayResources} from './replay-resource-initialization.ts';
import {drawOriginalReplayBar} from './replay-bar-raster.ts';
import {selectOriginalReplayControl} from './replay-control-selection.ts';
export interface NativeReplayBarArt {keys:ReadonlyArray<string>;resources:Record<string,ReadonlyArray<number>>}
/** Drawing/selection boundary for the original replay controller. The caller
 * supplies its already-loaded SDGAME pointer table and retained screen/font. */
export function createNativeReplayBar(host:{memory():Uint8Array;pixels():Uint8Array;font:Uint8Array;art:NativeReplayBarArt;present():void},d:number){
 return (mode:number,start:number,current:number)=>{
  const memory=host.memory();
  if(mode===0){initializeOriginalReplayResources(memory,d);return;}
  if(mode===2){selectOriginalReplayControl(memory,d,start);return;}
  if(mode!==1)throw Error('Replay input polling belongs to its native caller');
  const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),resources=new Map<number,ReadonlyArray<number>>();
  for(const [index,key] of host.art.keys.entries()){
   const at=d+0x54c8+index*4,address=view.getUint16(at,true)+view.getUint16(at+2,true)*16,resource=host.art.resources[key];
   if(!resource)throw Error('Missing original SDGAME replay resource '+key);
   const previous=resources.get(address);
   if(previous&&previous!==resource)throw Error('Original replay resource table contains conflicting pointers');
   resources.set(address,resource);
  }
  drawOriginalReplayBar(host.pixels(),memory,d,start,current,host.font,(offset,segment)=>{
   const resource=resources.get(segment*16+offset);if(!resource)throw Error('Original replay sprite pointer is not loaded');return resource;
  });
  host.present();
 };
}
