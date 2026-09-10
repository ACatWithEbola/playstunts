import {createOriginalSetupMenuDrawing,drawOriginalSetupBox,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
import {inputOriginalSetupText,type OriginalSetupTextInputHost} from './setup-text-input.ts';
export interface OriginalSetupPromptHost extends OriginalSetupTextInputHost {bell():void|Promise<void>;}
export function createOriginalSetupInstallPrompts(memory:Uint8Array,screen:OriginalSetupTextScreen,host:OriginalSetupPromptHost){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true),put=(at:number,n:number)=>v.setUint16(at,n&65535,true),drawing=createOriginalSetupMenuDrawing(screen,memory);
 const text=(at:number)=>{const out:number[]=[];for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out.push(n);}throw Error('Original setup string has no terminator');};
 const center=(pointer:number,left:number,right:number,row:number,foreground:number,background:number)=>{const value=text(pointer);writeOriginalSetupText(screen,value,Math.trunc(((left-value.length+right)<<16>>16)/2),row,foreground,background);};
 const upper=(n:number)=>n>=97&&n<=122?n-32:n;
 /** SETUP0D92: only Enter accepts; every other key rejects. */
 const message=async(first:number,second:number)=>{await host.bell();drawOriginalSetupBox(screen,memory,12,6,16,64,15,64,1);center(first,6,64,13,15,64);center(second,6,64,15,15,64);host.present();const key=await host.key();drawing.clear(12,6,16,64,112);drawing.drawHeader();host.present();return key===13?1:0;};
 /** SETUP0FA0: source disk, then destination; allocated source strings remain
  * in the original monotonic pool even when validation fails. */
 const destination=async()=>{
  for(;;){
   drawOriginalSetupBox(screen,memory,6,17,9,61,15,32,1);center(0x1246,17,61,7,15,32);drawing.helpBar(0x1262);
   let pointer=await inputOriginalSetupText(memory,screen,0x1298,38,8,2,15,0,host);put(0xaa10,pointer);
   if(!pointer){drawing.clear(6,17,9,61,112);host.present();return 0;}
   const value=text(pointer),pool=word(0x5de),end=(pool+value.length+1)&65535;pointer=0;
   if(end<0xaa08){pointer=pool;memory.set([...value,0],pool);put(0x5de,end);}put(0xaa10,pointer);
   const stored=text(pointer),drive=upper(stored[0]??0);
   if(stored.length===2&&drive>=65&&drive<=90&&stored[1]===58)break;
   await message(0x12bc,0x129c);
  }
  drawOriginalSetupBox(screen,memory,12,17,15,61,15,32,1);center(0x12dc,17,61,13,15,32);drawing.helpBar(0x12f2);
  const pointer=await inputOriginalSetupText(memory,screen,0x5a,19,14,40,15,0,host);drawing.clear(6,17,9,61,112);drawing.clear(12,17,15,61,112);host.present();return pointer;
 };
 return {message,destination};
}
