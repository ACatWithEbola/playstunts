import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
/** Original 1B342: four diagonal outline copies, then foreground text. */
export function drawOriginalOutlinedFontDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:Pick<OriginalMenuButtonDisplayHost,'text'>,text:string,x:number,y:number,colour:number,outline:number,scratch:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),font=v.getUint16(d+0x4dd2,true)*16,mask=mode==='cga'?3:15;
 memory.set([...Array.from(text,c=>c.charCodeAt(0)),0],d+scratch);v.setUint16(font+2,0,true);v.setUint16(font,outline&mask,true);
 for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]])host.text(scratch,x+dx,y+dy,false);
 v.setUint16(font,colour&mask,true);host.text(scratch,x,y,false);
}
