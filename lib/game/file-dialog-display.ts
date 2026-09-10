import {drawOriginalDialogDisplay,type OriginalDialogDisplayHost} from './dialog-display.ts';
import {measureOriginalFont} from './font-raster.ts';
/** Original file-list presentation through the selected native display driver.
 * Retains the stale string width used when clearing unused filename rows. */
export function drawOriginalFileDialogDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalDialogDisplayHost,resources:Record<string,ReadonlyArray<number>>,input:{names:ReadonlyArray<string>;path:string;title:string;selected:number;scroll:number},scratch:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true),font=word(0x4dd2)*16,colour=word(0x4e8a),border=word(0x4ec2),mask=mode==='cga'?3:15;
 const content=drawOriginalDialogDisplay(memory,d,mode,host,resources.eloa,0,{text:colour,border,disabled:word(0x4ec0)},scratch,undefined,3),fields=content.fields;
 const bytes=(s:string)=>Array.from(s,c=>c.charCodeAt(0)),width=(s:string)=>measureOriginalFont(memory.subarray(font,font+65536),bytes(s));
 const draw=(s:string,x:number,y:number,selected=false)=>{v.setUint16(font,(selected?0:colour)&mask,true);v.setUint16(font+2,(selected?colour:0)&mask,true);memory.set([...bytes(s),0],d+scratch);host.text(scratch,x,y,true);};
 const x=fields[1].x,right=x+162;host.rectangle(fields[2].x-4,fields[2].y+4,176,1,border);
 draw(input.title,fields[0].x,fields[0].y);draw(input.path,x,fields[1].y);
 const hits=Array.from({length:10},(_,i)=>({left:x,right,top:i===9?fields[9].y+10:fields[i+1].y,bottom:(i===9?fields[9].y+10:fields[i+1].y)+10}));
 let retained=input.title;
 if((input.names.length<<24>>24)>7)for(const [name,y] of [['elsu',hits[1].top],['elsd',hits[9].top-1]] as const){retained=String.fromCharCode(...resources[name]).split('\0')[0];draw(retained,Math.trunc((320-width(retained))/2),y);}
 for(let i=0;i<7;i++){const index=input.scroll+i,hit=hits[i+2];let text='        ';if(index<input.names.length){retained=input.names[index];text=retained;}draw(text,x,hit.top,index===input.selected);const w=width(retained);host.rectangle(x+w,hit.top,right-w-x,8,0,false);}
 return {...content,hits};
}
