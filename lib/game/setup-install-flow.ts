export interface OriginalSetupInstallHost {
 destination():number|Promise<number>;
 message(first:number,second:number):number|Promise<number>;
 prepareDirectory(destination:number,file:number):number|Promise<number>;
 installDisk(index:number,destination:number,files:number):number|Promise<number>;
 changeDrive(drive:number):number|Promise<number>;
 changeDirectory(path:string):number|Promise<number>;
}
/** Supplied SETUP0E2A..0F9F. Cancelling file installation still changes the
 * current drive/directory afterward; cancelling the destination prompt does not. */
export async function installOriginalSetup(memory:Uint8Array,host:OriginalSetupInstallHost){
 const word=(at:number)=>memory[at]|memory[at+1]<<8,upper=(n:number)=>n>=97&&n<=122?n-32:n;
 const text=(at:number)=>{let out='';for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out+=String.fromCharCode(n);}throw Error('Original setup string has no terminator');};
 let destination=0,drive=0;
 for(;;){
  destination=await host.destination();if(!destination)return 0;
  const first=upper(memory[destination]);
  if(first<65||first>90||memory[destination+1]!==58){await host.message(0x111e,0x1104);continue;}
  if(first===upper(memory[word(0xaa10)])){await host.message(0x116a,0x1150);continue;}
  drive=first-65;
  // Original1F28 token scratch is retained after the directory check.
  let at=0x11a0,to=0x99a4;while(memory[at]===32)at++;while(memory[at]&&memory[at]!==32)memory[to++]=memory[at++];memory[to]=0;
  let status=await host.prepareDirectory(destination,0x99a4);
  if(status===0){if(await host.message(0x11d8,0x11a4))status=1;}
  else if(status===2)await host.message(0x121e,0x11fc);
  if(status===1)break;
 }
 for(let index=0;word(0x64+index*2);index++)if(await host.installDisk(index,destination,word(0x64+index*2))===27)break;
 await host.changeDrive(drive);return await host.changeDirectory(text(destination));
}
export interface OriginalSetupDirectoryHost {exists(path:string,attribute:number):number|Promise<number>;makeDirectory(path:string):number|Promise<number>;}
/** SETUP136C: builds its retained98D2 path and strips the final backslash
 * component before checking/creating the directory. Return0 exists,1 made,2 failed. */
export async function prepareOriginalSetupDirectory(memory:Uint8Array,destination:number,file:number,host:OriginalSetupDirectoryHost){
 const text=(at:number)=>{let out='';for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out+=String.fromCharCode(n);}throw Error('Original setup string has no terminator');};
 const name=text(file),path=text(destination)+(name.startsWith('\\')?'':'\\')+name;
 for(let i=0;i<path.length;i++)memory[0x98d2+i]=path.charCodeAt(i);memory[0x98d2+path.length]=0;
 const slash=path.lastIndexOf('\\');if(slash>=0)memory[0x98d2+slash]=0;const directory=text(0x98d2);
 if(await host.exists(directory,16))return 0;
 return ((await host.makeDirectory(directory))<<16>>16)<0?2:1;
}
