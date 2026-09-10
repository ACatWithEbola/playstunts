import {allocateOriginalDisplayWindow,freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
/** Retained browser presentation region, stored in original bitmap format.
 * The allocation must close in LIFO order; restore may be called repeatedly. */
export function captureNativeDisplayRegion(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,rect:{x:number;y:number;width:number;height:number}){
 const {mode,d,drawing}=owner,c=0x209e0,active=mode==='cga'?0x6862:mode==='tandy'?0x63d2:0x9112;
 const before=owner.memory(),saved=before.slice(c+active,c+active+30),page=before.slice(d+0x563a,d+0x563c);
 restoreOriginalDisplayWindow(before,d,mode);
 const allocated=allocateOriginalDisplayWindow(before,d,mode,rect.width,rect.height);
 if(allocated.error||!allocated.window){before.set(saved,c+active);if(mode==='ega')before.set(page,d+0x563a);throw Error('Original display region allocation failed: '+allocated.error);}
 owner.writeMemory(allocated.memory);const pointer={offset:0,segment:allocated.segment};drawing.capture(pointer,{x:rect.x,y:rect.y});let closed=false;
 return {restore(){if(closed)throw Error('Original display region is closed');restoreOriginalDisplayWindow(owner.memory(),d,mode);drawing.unclippedBitmap(pointer,{x:rect.x,y:rect.y});},close(){if(closed)return;closed=true;const m=owner.memory();m.set(saved,c+active);if(mode==='ega')m.set(page,d+0x563a);const result=freeOriginalDisplayWindow(m,d,mode,allocated.window!.offset,allocated.window!.segment);if(result.error)throw Error('Original display region release failed: '+result.error);owner.writeMemory(result.memory);}};
}
