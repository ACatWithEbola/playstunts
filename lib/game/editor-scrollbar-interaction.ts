import {editorScrollbarGeometry} from './editor-scrollbar-geometry.ts';
/** Original scrollbar click/drag result; pointer positions are relative to the control. */
export function editorScrollbarRelease(width:number,height:number,value:number,visible:number,total:number,initial:number,release:number){
 const g=editorScrollbarGeometry(width,height,value,visible,total);
 if(initial<g.start)return (value===0?value:value-1)&65535;
 if(initial>g.end)return (value<total-1?value+1:value)&65535;
 const signed=(n:number)=>(n<<16)>>16;
 let position=signed(signed(release-initial)+g.start);
 if(position<0)position=0;
 else if(position+g.size>g.length-1)position=g.length-g.size-1;
 const half=Math.trunc(Math.trunc(g.length/total)/2);
 return Math.trunc(signed((position+half)*total)/g.length)&65535;
}
