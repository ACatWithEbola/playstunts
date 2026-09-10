import {interactNativePathEntry,type NativePathEntryHost} from './native-path-entry.ts';
import {drawOriginalTextEntryDisplay,type OriginalTextEntryDisplayHost} from './text-entry-display.ts';
/** Same original filename editing and timing, rendered by the selected driver. */
export function editNativeDisplayPath(host:Pick<NativePathEntryHost,'present'|'counters'|'keyboard'>&{memory():Uint8Array;d:number;mode:'cga'|'tandy'|'ega';drawing:OriginalTextEntryDisplayHost},path:string,length:number,timeout:number,field:{x:number;y:number},scratch:number){
 return interactNativePathEntry({...host,draw:(text,cursor,x,y,width,height,visible)=>drawOriginalTextEntryDisplay(host.memory(),host.d,host.mode,host.drawing,text,cursor,x,y,width,height,visible,scratch)},path,length,timeout,field);
}
