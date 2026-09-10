import {drawOriginalEditorDisplayFrame} from './editor-display-chrome.ts';
import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
type Pointer={offset:number;segment:number};
export interface OriginalEvaluationDisplayHost extends OriginalMenuButtonDisplayHost {unclippedPackedBitmap(pointer:Pointer,position:{x:number;y:number}):void}
/** Original 61C4..6256. Geometry comes from op01, in driver byte units;
 * the animation bitmap keeps that position even if its own dimensions differ. */
export function drawOriginalEvaluationPortraitDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalEvaluationDisplayHost,first:Pointer,current:Pointer){
 const word=(at:number)=>memory[at]|(memory[at+1]<<8),base=first.segment*16,header=(at:number)=>word(base+((first.offset+at)&65535)),units=word(d+{cga:0x96da,tandy:0x971a,ega:0x9556}[mode]);
 const width=(header(0)*units)&65535,height=header(2),x=(312-width)<<16>>16,y=Math.trunc(((99-height)<<16>>16)/2);
 drawOriginalEditorDisplayFrame(host,x-3,y-3,width+5,height+5,word(d+0x4e8a),0,word(d+0x4e92));
 host.unclippedPackedBitmap(current,{x,y});return {x,y,width,height};
}
