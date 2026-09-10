import {drawOriginalEvaluationPortrait} from './opponent-evaluation-portrait.ts';
import {originalEvaluationText} from './opponent-evaluation-text.ts';
import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Original61c4..6464. Caller supplies its retained result background and
 * the already selected original comment fragments. */
export function drawOriginalEvaluationPanel(target:Uint8Array,font:Uint8Array,first:ReadonlyArray<number>,portrait:ReadonlyArray<number>,fragments:ReadonlyArray<ReadonlyArray<number>>,color=0){
 const geometry=drawOriginalEvaluationPortrait(target,first,portrait),lines=originalEvaluationText(fragments,geometry.x,bytes=>measureOriginalFont(font,bytes)),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 for(const line of lines)drawOriginalFont(target,font,String.fromCharCode(...line.text),line.x,line.y,color,rows);
 return geometry;
}
