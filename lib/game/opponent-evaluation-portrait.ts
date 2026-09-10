import {drawOriginalEditorFrame} from './editor-chrome.ts';
/** Original61c4..6256, normal VGA mode. Position and frame use op01's
 * dimensions; the selected animation sprite is drawn at that same origin. */
export function drawOriginalEvaluationPortrait(target:Uint8Array,first:ReadonlyArray<number>,current:ReadonlyArray<number>){
 const word=(bytes:ReadonlyArray<number>,offset:number)=>bytes[offset]|bytes[offset+1]<<8;
 const width=word(first,0),height=word(first,2),x=312-width,y=Math.trunc((99-height)/2);
 drawOriginalEditorFrame(target,x-3,y-3,width+5,height+5,15,0,8);
 const currentWidth=word(current,0),currentHeight=word(current,2);
 for(let row=0;row<currentHeight;row++)for(let col=0;col<currentWidth;col++)target[((y+row)*320+x+col)&65535]=current[16+row*currentWidth+col];
 return {x,y,width,height};
}
