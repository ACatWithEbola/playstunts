import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {editorScrollbarGeometry} from './editor-scrollbar-geometry.ts';
/** Source 1b4a8: two outer bevel lines and a third line in the middle colour.
 * The enclosed pixels are retained; this routine does not fill the panel. */
export function drawOriginalEditorFrame(target:Uint8Array,x:number,y:number,width:number,height:number,light:number,middle:number,dark:number){
 const put=(x:number,y:number,color:number)=>{if(x>=0&&x<320&&y>=0&&y<200)target[y*320+x]=color;};
 for(let inset=0;inset<3;inset++)for(let col=x+inset;col<=x+width-inset;col++)put(col,y+inset,inset===2?middle:light);
 for(let inset=0;inset<3;inset++)for(let row=y+inset;row<=y+height-inset;row++)put(x+inset,row,inset===2?middle:light);
 for(let inset=0;inset<3;inset++)for(let col=x+inset;col<=x+width-inset;col++)put(col,y+height-inset,inset===2?middle:dark);
 for(let inset=0;inset<3;inset++)for(let row=y+inset;row<=y+height-inset;row++)put(x+width-inset,row,inset===2?middle:dark);
}
/** Source 1c6c4..1c86d. Text comes unchanged from TEDIT.PRE. */
export function drawOriginalEditorChrome(target:Uint8Array,font:Uint8Array,text:Record<string,ReadonlyArray<number>>){
 const button=(name:string,x:number,y:number,width:number,height:number)=>drawOriginalMenuButton(target,font,text[name],x,y,width,height,15,8,7,0);
 button('ebti',217,3,102,22);
 drawOriginalEditorFrame(target,5,0,206,190,11,9,1);drawOriginalEditorFrame(target,217,32,102,158,11,9,1);
 button('ebsc',221,140,94,14);button('eblo',221,156,46,14);button('ebsa',221,172,46,14);button('ebcl',269,156,46,14);button('ebex',269,172,46,14);
}
/** Source 1ae48 drawing mode zero. */
export function drawOriginalEditorScrollbar(target:Uint8Array,x:number,y:number,width:number,height:number,value:number,visible:number,total:number,color:number){
 const geometry=editorScrollbarGeometry(width,height,value,visible,total);
 drawOriginalEditorScrollbarThumb(target,x,y,width,height,geometry.start,geometry.size,color);
}
export function drawOriginalEditorScrollbarThumb(target:Uint8Array,x:number,y:number,width:number,height:number,start:number,size:number,color:number){
 const fill=(x:number,y:number,w:number,h:number,c:number)=>{for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)if(row>=0&&row<200&&col>=0&&col<320)target[row*320+col]=c;};
 fill(x,y,width,height,0);
 if(width<=height)fill(x,y+start,width,size,color);else fill(x+start,y,size,height,color);
}
