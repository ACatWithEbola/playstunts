import {createOriginalSetupMenuDrawing,drawOriginalSetupBox,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
import type {OriginalSetupPromptHost} from './setup-install-prompts.ts';
export interface OriginalSetupDiskPromptHost extends OriginalSetupPromptHost {exists(path:string,attribute:number):number|Promise<number>;}
/** Supplied11D0..136A. Enter is returned immediately when the identifying file
 * exists; any key other than Escape retries a missing disk after its prompt. */
export async function requestOriginalSetupDisk(memory:Uint8Array,screen:OriginalSetupTextScreen,index:number,host:OriginalSetupDiskPromptHost){
 const word=(at:number)=>memory[at]|memory[at+1]<<8,text=(at:number)=>{const out:number[]=[];for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out.push(n);}throw Error('Original setup text has no terminator');};
 const drawing=createOriginalSetupMenuDrawing(screen,memory),title=[...text(0x132c),...text(0x46),...text(0x132e),...text(word(0x6a+index*2))];memory.set([...title,0],0x98d2);
 const drive=memory[word(0xaa10)];memory[0x3b7]=drive>=97&&drive<=122?drive-32:drive;
 const left=Math.trunc((60-title.length)/2),right=Math.trunc((60+title.length)/2),path=String.fromCharCode(...text(word(0xaa10)),...text(word(0x70+index*2)));
 const center=(pointer:number,row:number)=>{const value=text(pointer);writeOriginalSetupText(screen,value,Math.trunc(((left+1-value.length+right-1)<<16>>16)/2),row,15,80);};
 let result=13;
 while(!await host.exists(path,0)){
  drawing.helpBar(0x1332);drawOriginalSetupBox(screen,memory,7,left-1,12,right+1,15,80,1);center(0x135c,8);center(0x98d2,9);center(0x3ae,10);center(0x1364,11);await host.bell();host.present();result=await host.key();drawing.clear(7,left-1,12,right+1,112);host.present();if(result===27)break;
 }
 return result;
}
export interface OriginalSetupDiskFilesHost {
 requestDisk(index:number):number|Promise<number>;
 prepareDirectory(destination:number,file:number):number|Promise<number>;
 copyFiles(destination:number,file:number):number|Promise<number>;
 error(code:number,path:string):void|Promise<void>;
}
/** Supplied1154..11CF. File tokens use the shared99A4 scratch; no invented
 * whitespace normalization or cancellation rules are added. */
export async function installOriginalSetupDiskFiles(memory:Uint8Array,index:number,destination:number,files:number,host:OriginalSetupDiskFilesHost){
 let result=await host.requestDisk(index);if(result!==13)return result;
 const text=(at:number)=>{let out='';for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out+=String.fromCharCode(n);}throw Error('Original setup token has no terminator');};
 for(;;){
  if(!memory[files])break;
  let source=files,to=0x99a4;while(memory[source]===32)source++;while(memory[source]&&memory[source]!==32)memory[to++]=memory[source++];memory[to]=0;
  if(await host.prepareDirectory(destination,0x99a4)===2)await host.error(6,text(0x99a4));result=await host.copyFiles(destination,0x99a4);if(result===27)break;
  files=(files+text(0x99a4).length)&65535;while(memory[files]===32)files=(files+1)&65535;
 }
 return result;
}
