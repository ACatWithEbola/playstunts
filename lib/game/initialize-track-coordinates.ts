import {TRACK_DISPLAY_LAYOUTS,type OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Original main-entry 281B..28AC: fixed 30-by-30 track coordinate tables. */
export function initializeOriginalTrackCoordinates(memory:Uint8Array,d:number,framePointer:number,layout:OriginalTrackDisplayLayout=TRACK_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),set=(at:number,value:number)=>v.setUint16(d+(at&65535),value&65535,true);
 for(let i=0;i<30;i++){
  const index=i*2,reverse=29-i;
  set(framePointer-12,index);set(framePointer-14,reverse);
  set(layout.address(0xa350)+index,reverse*30);set(layout.address(0x89d4)+index,i*30);
  set(framePointer-16,reverse<<10);set(layout.address(0x7f9e)+index,reverse<<10);set(layout.address(0xa796)+index,(reverse<<10)+512);
  set(framePointer-18,i<<10);set(layout.address(0x90a4)+index,i<<10);set(layout.address(0x732e)+index,(i<<10)+512);
 }
 for(let i=0;i<30;i++){set(framePointer-18,i*2);set(layout.address(0x7376)+i*2,i<<10);set(layout.address(0xa3e2)+i*2,(i<<10)+512);}
}
