import {drawOriginalDialog} from './dialog-raster.ts';
import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
/** Supplied file dialog presentation through first input at1a6b2. Resources
 * are the unchanged MAIN.RES loa/lsu/lsd strings and caller-provided title.
 */
export function drawOriginalFileDialog(target:Uint8Array,font:Uint8Array,resources:Record<string,ReadonlyArray<number>>,input:{names:ReadonlyArray<string>;path:string;title:string;selected:number;scroll:number}){
 const content=drawOriginalDialog(target,font,resources.eloa,0,{text:15,border:4,disabled:1},undefined,3),fields=content.fields;
 const bytes=(s:string)=>Array.from(s,c=>c.charCodeAt(0)),width=(s:string)=>measureOriginalFont(font,bytes(s)),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 const draw=(s:string,x:number,y:number,selected=false)=>drawOriginalFont(target,font,s,x,y,selected?0:15,rows,selected?15:0);
 const rect=(x:number,y:number,w:number,h:number,color:number)=>{for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)target[(row*320+col)&65535]=color;};
 const x=fields[1].x,right=x+162;
 rect(fields[2].x-4,fields[2].y+4,176,1,4);
 draw(input.title,fields[0].x,fields[0].y);draw(input.path,x,fields[1].y);
 const hits=Array.from({length:10},(_,i)=>({left:x,right,top:i===9?fields[9].y+10:fields[i+1].y,bottom:(i===9?fields[9].y+10:fields[i+1].y)+10}));
 let scratch=input.title;
 if((input.names.length<<24>>24)>7){for(const [name,y] of [['elsu',hits[1].top],['elsd',hits[9].top-1]] as const){scratch=String.fromCharCode(...resources[name]).split('\0')[0];draw(scratch,Math.trunc((320-width(scratch))/2),y);}}
 for(let i=0;i<7;i++){
  const index=input.scroll+i,hit=hits[i+2];let text='        ';
  if(index<input.names.length){scratch=input.names[index];text=scratch;}
  draw(text,x,hit.top,index===input.selected);const w=width(scratch);rect(x+w,hit.top,right-w-x,8,0);
 }
 return {...content,hits};
}
