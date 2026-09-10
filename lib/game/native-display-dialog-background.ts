import {allocateOriginalDisplayWindow,freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
/** Browser dialog presentation over the currently shown original screen.
 * Uses native packed/planar capture and bitmap restoration. The complete screen
 * is retained by this host; original dialog layout still limits drawing. */
export function captureNativeDisplayDialogBackground(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,retain=false){
 const {mode,d,drawing}=owner,c=0x209e0,active=mode==='cga'?0x6862:mode==='tandy'?0x63d2:0x9112;
 const before=owner.memory(),saved=before.slice(c+active,c+active+30),drawingPage=before.slice(d+0x563a,d+0x563c);
 restoreOriginalDisplayWindow(before,d,mode);
 if(retain)return ()=>{};
 const allocated=allocateOriginalDisplayWindow(before,d,mode,320,200);
 if(allocated.error||!allocated.window){before.set(saved,c+active);if(mode==='ega')before.set(drawingPage,d+0x563a);throw Error('Original dialog background allocation failed: '+allocated.error);}
 owner.writeMemory(allocated.memory);const pointer={offset:0,segment:allocated.segment};drawing.capture(pointer,{x:0,y:0});let closed=false;
 return ()=>{
  if(closed)return;closed=true;
  const memory=owner.memory();restoreOriginalDisplayWindow(memory,d,mode);drawing.unclippedBitmap(pointer,{x:0,y:0});
  memory.set(saved,c+active);if(mode==='ega')memory.set(drawingPage,d+0x563a);
  const released=freeOriginalDisplayWindow(memory,d,mode,allocated.window!.offset,allocated.window!.segment);
  if(released.error)throw Error('Original dialog background release failed: '+released.error);owner.writeMemory(released.memory);
 };
}
