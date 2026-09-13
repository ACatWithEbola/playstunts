import {drawNativeFullRedrawRaceLayers} from './full-redraw-race-layers.ts';
/** Recover the source overlay coverage without changing either retained image.
 * Complementary world fills distinguish transparent windshield pixels from
 * dashboard, replay, crash and status pixels, including AND/OR sprite masks. */
export function createRaceOverlayMask(source:Uint8Array,live:Uint8Array,rectangle:readonly number[],fireballMask?:Uint8Array){
 return createRaceOverlayMaskRenderer()(source,live,rectangle,fireballMask);
}

/** Reusable scratch buffers keep the complementary overlay reconstruction
 * allocation-free after its first captured frame. */
export function createRaceOverlayMaskRenderer(){
 let memories:Uint8Array[]=[],lives:Uint8Array[]=[],mask=new Uint8Array(64000);
 return (source:Uint8Array,live:Uint8Array,rectangle:readonly number[],fireballMask?:Uint8Array)=>{
  if(memories[0]?.length!==source.length)memories=[new Uint8Array(source.length),new Uint8Array(source.length)];
  if(lives[0]?.length!==live.length)lives=[new Uint8Array(live.length),new Uint8Array(live.length)];
  if(mask.length!==64000)mask=new Uint8Array(64000);
  const [left,right,top,bottom]=rectangle;
  for(let pass=0;pass<2;pass++){
   const memory=memories[pass],scratch=lives[pass],color=pass?255:0;memory.set(source);scratch.set(live);
   drawNativeFullRedrawRaceLayers(memory,scratch,0x2d1a0,0xeefe,()=>{
    for(let y=Math.max(0,top);y<Math.min(200,bottom);y++)memory.fill(color,0xa0000+y*320+Math.max(0,left),0xa0000+y*320+Math.min(320,right));
   });
  }
  const first=memories[0],second=memories[1];
  for(let i=0;i<64000;i++)mask[i]=Number(first[0xa0000+i]===second[0xa0000+i]||!!fireballMask?.[i]);
  return mask;
 };
}
