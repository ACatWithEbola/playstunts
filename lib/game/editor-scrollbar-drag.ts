import {editorScrollbarGeometry} from './editor-scrollbar-geometry.ts';
/** Original 1af88..1afb6, the visual thumb position while held. */
export function editorScrollbarDrag(width:number,height:number,value:number,visible:number,total:number,initial:number,current:number){
 const g=editorScrollbarGeometry(width,height,value,visible,total),signed=(v:number)=>(v<<16)>>16;
 let start=signed(signed(current-initial)+g.start);
 if(start<0)start=0;else if(start+g.size>g.length-1)start=g.length-g.size-1;
 return {...g,start,end:start+g.size,dragging:initial>=g.start&&initial<=g.end};
}
