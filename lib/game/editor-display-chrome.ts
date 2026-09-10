import {drawOriginalMenuButtonDisplay,type OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
import {editorScrollbarGeometry} from './editor-scrollbar-geometry.ts';
/** Original 1B4A8 frame: retain its interior and bottom/right overdraw order. */
export function drawOriginalEditorDisplayFrame(host:OriginalMenuButtonDisplayHost,x:number,y:number,width:number,height:number,light:number,middle:number,dark:number){
 for(let inset=0;inset<3;inset++)host.rectangle(x+inset,y+inset,width-2*inset+1,1,inset===2?middle:light);
 for(let inset=0;inset<3;inset++)host.rectangle(x+inset,y+inset,1,height-2*inset+1,inset===2?middle:light);
 for(let inset=0;inset<3;inset++)host.rectangle(x+inset,y+height-inset,width-2*inset+1,1,inset===2?middle:dark);
 for(let inset=0;inset<3;inset++)host.rectangle(x+width-inset,y+inset,1,height-2*inset+1,inset===2?middle:dark);
}
/** Original 1C6C4..1C86D with driver-specific colour words. */
export function drawOriginalEditorDisplayChrome(memory:Uint8Array,d:number,host:OriginalMenuButtonDisplayHost,text:Record<string,readonly number[]>,scratch:number){
 const word=(at:number)=>memory[d+at]|memory[d+at+1]<<8,button=(name:string,x:number,y:number,width:number,height:number)=>drawOriginalMenuButtonDisplay(memory,d,host,text[name],x,y,width,height,word(0x4eb4),word(0x4eb6),word(0x4eb8),0,scratch);
 button('ebti',217,3,102,22);
 drawOriginalEditorDisplayFrame(host,5,0,206,190,word(0x4eac),word(0x4eae),word(0x4eb0));drawOriginalEditorDisplayFrame(host,217,32,102,158,word(0x4eac),word(0x4eae),word(0x4eb0));
 button('ebsc',221,140,94,14);button('eblo',221,156,46,14);button('ebsa',221,172,46,14);button('ebcl',269,156,46,14);button('ebex',269,172,46,14);
}
export function drawOriginalEditorDisplayScrollbar(host:OriginalMenuButtonDisplayHost,x:number,y:number,width:number,height:number,value:number,visible:number,total:number,colour:number){
 const geometry=editorScrollbarGeometry(width,height,value,visible,total);host.rectangle(x,y,width,height,0,false);
 if(geometry.vertical)host.rectangle(x,y+geometry.start,width,geometry.size,colour,false);else host.rectangle(x+geometry.start,y,geometry.size,height,colour,false);
}
