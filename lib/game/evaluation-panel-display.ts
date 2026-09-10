import {drawOriginalEvaluationPortraitDisplay,type OriginalEvaluationDisplayHost} from './evaluation-portrait-display.ts';
import {originalEvaluationText} from './opponent-evaluation-text.ts';
import {measureOriginalFont} from './font-raster.ts';
/** Original evaluation text retains the selected small font's foreground. */
export function drawOriginalEvaluationPanelDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalEvaluationDisplayHost,first:{offset:number;segment:number},portrait:{offset:number;segment:number},fragments:ReadonlyArray<ReadonlyArray<number>>,smallFontSegment:number,scratch:number){
 const geometry=drawOriginalEvaluationPortraitDisplay(memory,d,mode,host,first,portrait),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),normal=v.getUint16(d+0x4dd2,true),font=smallFontSegment*16;
 v.setUint16(normal*16,0,true);v.setUint16(normal*16+2,0,true);v.setUint16(d+0x4dd2,smallFontSegment,true);
 const lines=originalEvaluationText(fragments,geometry.x,bytes=>measureOriginalFont(memory.subarray(font,font+65536),bytes));
 for(const line of lines){memory.set([...line.text,0],d+scratch);host.text(scratch,line.x,line.y,false);}
 v.setUint16(d+0x4dd2,normal,true);return geometry;
}
