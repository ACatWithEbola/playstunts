import {fillOriginalSetupText,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
export interface OriginalSetupTextInputHost {key():number|Promise<number>;present():void;cursorShape(shape:number):void;}
/** Supplied SETUP0AB6..0CD7. The initial mode overwrites; Insert toggles insertion.
 * Both modes stop accepting characters when the full string reaches the limit. */
export async function inputOriginalSetupText(memory:Uint8Array,screen:OriginalSetupTextScreen,initial:number,column:number,row:number,limit:number,foreground:number,background:number,host:OriginalSetupTextInputHost){
 const word=(at:number)=>memory[at]|memory[at+1]<<8;
 const length=(at:number)=>{let n=0;while(memory[(at+n)&65535])n++;return n;};
 const copy=(to:number,from:number)=>{let value:number;do{value=memory[from++&65535];memory[to++&65535]=value;}while(value);};
 const remove=(position:number)=>{if(position<0)return;copy(0x9880,0x982e+position+1);copy(0x982e+position,0x9880);};
 host.cursorShape(word(0x3aa));memory.fill(0,0x982e,0x982e+0x51);if(initial)copy(0x982e,initial);
 let cursor=column+length(0x982e),mode=0,dirty=true;
 for(;;){
  if(dirty){host.cursorShape(0x2000);const bytes=memory.subarray(0x982e,0x982e+length(0x982e));writeOriginalSetupText(screen,bytes,column,row,foreground,background);fillOriginalSetupText(screen,row,column+bytes.length,row,column+limit,background);host.cursorShape(word(0x3aa+mode*2));dirty=false;}
  screen.column=cursor;screen.row=row;host.present();const key=await host.key();
  if(key===27||key===13){host.cursorShape(0x2000);return key===13?0x982e:0;}
  if(key===0x4700)cursor=column;
  else if(key===0x4f00)cursor=column+length(0x982e);
  else if(key===0x4b00)cursor=Math.max(column,cursor-1);
  else if(key===0x4d00)cursor=Math.min(column+length(0x982e),cursor+1);
  else if(key===0x5200){mode=(mode+1)%2;host.cursorShape(word(0x3aa+mode*2));}
  else if(key===0x5300){remove(cursor-column);dirty=true;}
  else if(key===8){remove(cursor-column-1);cursor=Math.max(column,cursor-1);dirty=true;}
  else if(length(0x982e)<limit&&key>=31&&key<=255){const at=0x982e+cursor-column;if(mode){copy(0x9880,at);memory[at]=key;copy(at+1,0x9880);}else memory[at]=key;cursor++;dirty=true;}
 }
}
