import {measureOriginalFont} from './font-raster.ts';
import type {OriginalTrackMenuDisplayHost} from './track-menu-display.ts';
/** Original 56BF..575C: selected-driver background and two shadowed headings. */
export function drawOriginalOptionsDisplayBackground(memory:Uint8Array,d:number,host:OriginalTrackMenuDisplayHost&{clearWindow(colour:number):void},resources:Record<string,ReadonlyArray<number>>,scratch:number){
 const word=(at:number)=>memory[d+at]|memory[d+at+1]<<8,font=word(0x4dd2)*16;host.clearWindow(word(0x4eba));
 for(const [name,y] of [['gstu',6],['gver',16]] as const){const bytes=resources[name],zero=bytes.indexOf(0),text=zero<0?bytes:bytes.slice(0,zero);memory.set(text,d+scratch);memory[d+scratch+text.length]=0;const x=Math.trunc((320-measureOriginalFont(memory.subarray(font,font+65536),text))/2);host.shadowText(scratch,x,y,word(0x4e8a),0);}
}
