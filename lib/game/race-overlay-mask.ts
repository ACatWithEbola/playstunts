import {drawNativeFullRedrawRaceLayers} from './full-redraw-race-layers.ts';
/** Recover the source overlay coverage without changing either retained image.
 * Complementary world fills distinguish transparent windshield pixels from
 * dashboard, replay, crash and status pixels, including AND/OR sprite masks. */
export function createRaceOverlayMask(source:Uint8Array,live:Uint8Array,rectangle:readonly number[],fireballMask?:Uint8Array){
 const [left,right,top,bottom]=rectangle,images=[0,255].map(color=>{
  const memory=source.slice();
  drawNativeFullRedrawRaceLayers(memory,live.slice(),0x2d1a0,0xeefe,()=>{
   for(let y=Math.max(0,top);y<Math.min(200,bottom);y++)memory.fill(color,0xa0000+y*320+Math.max(0,left),0xa0000+y*320+Math.min(320,right));
  });
  return memory.subarray(0xa0000,0xa0000+64000);
 });
 return Uint8Array.from(images[0],(value,i)=>Number(value===images[1][i]||!!fireballMask?.[i]));
}
