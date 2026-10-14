import {nativeRaceRenderWindow} from './native-race-render-window.ts';
import {selectOriginalSpriteWindow,restoreOriginalVideoWindow} from './select-sprite-window.ts';
import {saveOriginalBitmapBackground,drawOriginalRawBitmap} from './cockpit-bitmap-raster.ts';
import {presentMs91Repaint} from './ms91-repaint-presentation.ts';
import type {createMs91RepaintState} from './ms91-repaint-state.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
/** MCGA retained-window bridge. Called at the original world/present points,
 * before direct-screen cockpit updates. Resource pointers stay caller-owned. */
export function createNativeMcgaCopyPresentation(memory:Uint8Array,d:number,state:ReturnType<typeof createMs91RepaintState>,frame:{fullRedraw:boolean;seed:boolean;heading:number;worldFullRedraw():boolean}){
 const window=nativeRaceRenderWindow(memory,d,'mcga'),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),cs=0x209e0;
 let presented=false,copies=0;
 return {get presented(){return presented;},get copies(){return copies;},beforeWorld(){
  if(frame.seed||frame.fullRedraw){restoreOriginalVideoWindow(memory);saveOriginalBitmapBackground(memory,window.bitmap.offset,window.bitmap.segment,0,0);}
  selectOriginalSpriteWindow(memory,window.window.offset,window.window.segment);
 },present(pointer:number){
  const clip=Array.from({length:4},(_,i)=>v.getInt16(d+((pointer+i*2)&65535),true)) as Ms91Rectangle;
  const current=Array.from({length:15},(_,index)=>Array.from({length:4},(_,i)=>v.getInt16(d+0x901a+index*8+i*2,true)) as Ms91Rectangle);
  if(frame.worldFullRedraw()){current[0]=[...clip];for(let i=1;i<15;i++)current[i]=[320,0,200,0];}
  const plan=state.prepare(current,clip,frame.heading,{enabled:true,fullRedraw:frame.fullRedraw,pageFlipping:false,detail:memory[d+0x134]});
  presentMs91Repaint(plan,{selectScreen(){restoreOriginalVideoWindow(memory);},bounds(left,right,top,bottom){for(const [at,n] of [[0x5dae,left],[0x5da0,left],[0x5db0,right],[0x5da2,right],[0x5da4,top],[0x5da6,bottom]])v.setUint16(cs+at,n&65535,true);},beginCopy(){},endCopy(){},copyRenderWindow(){drawOriginalRawBitmap(memory,window.bitmap.offset,window.bitmap.segment,0,0,'copy');copies++;}});
  presented=true;
 }};
}
