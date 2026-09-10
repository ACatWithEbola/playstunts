import {drawOriginalWorldStatus} from './world-status-overlay.ts';
import type {OriginalRaceStatusDrawingHost} from './race-status-overlay.ts';
import {drawOriginalViewCrash} from './view-crash-overlay.ts';
/** Verified upper-data operands in original DD98..DE30 and F15C..F3AC. */
const fields=new Set([0x9acc,0x93da,0x9ae8,0x8c26,0x8ce9,0x8eab,0x8f13,0x8f14,0x8fbd,0x8fbe,0x8fc0,0x901a,0x904a,0x90f8,0x9ada,0xa004,0xa006,0xa034,0xa3c2,0xa3d8,0xa3dc,0xa42a,0xa78e,0xa7da,0xa7dc,0xa9f0,0xa9f4,0xaa6e,0x8c26,0x8c2c,0x8c2e,0x8ce9,0x8da1,0x8fbe,0x8fc0,0x901a,0xa78e,0xa790,0xa792,0xa794,0xa9f0,0xa9f2]);
export const RACE_OVERLAY_DISPLAY_LAYOUTS:Record<'cga'|'tandy'|'ega',(mcga:number)=>number>=Object.fromEntries((['cga','tandy','ega'] as const).map((mode,index)=>[mode,(n:number)=>n+(n===0x73b2?[0x5e0,0x620,0x460][index]:fields.has(n)?[0x5e0,0x620,0x45c][index]:0)])) as Record<'cga'|'tandy'|'ega',(mcga:number)=>number>;
export interface OriginalRaceOverlayDrawingHost {bounds(left:number,right:number,top:number,bottom:number):void;line(x0:number,y0:number,x1:number,y1:number,colour:number):void;rectangle(x:number,y:number,width:number,height:number,colour:number):void;}
export function drawOriginalViewCrashDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',drawing:OriginalRaceOverlayDrawingHost,rectangle:number,worldFramePointer:number){
 drawOriginalViewCrash(memory,d,rectangle,worldFramePointer,{clip:(...args)=>drawing.bounds(...args),line:(...args)=>drawing.line(...args),rectangle:(...args)=>drawing.rectangle(...args)},RACE_OVERLAY_DISPLAY_LAYOUTS[mode]);
}

export function drawOriginalWorldStatusDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',drawing:OriginalRaceStatusDrawingHost,worldFramePointer:number){
 drawOriginalWorldStatus(memory,d,worldFramePointer,drawing,RACE_OVERLAY_DISPLAY_LAYOUTS[mode]);
}
