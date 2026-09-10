import {createOriginalSetupMenuDrawing,drawOriginalSetupBox,fillOriginalSetupText,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
export interface OriginalSetupCopyFilesHost {
 findFirst(path:string,attribute:number):number|Promise<number>;
 findNext():number|Promise<number>;
 pollKey():number|Promise<number>;
 copyFile(destination:string,source:string):void|Promise<void>;
 error(code:number,path:string):void|Promise<void>;
 present():void;
}
/** Supplied0618..07EA. Search results are pointers into the original DTA name
 * buffer supplied by the host, with source/destination scratch retained. */
export async function copyOriginalSetupFiles(memory:Uint8Array,screen:OriginalSetupTextScreen,destination:number,file:number,host:OriginalSetupCopyFilesHost){
 const word=(at:number)=>memory[at]|memory[at+1]<<8,text=(at:number)=>{let out='';for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out+=String.fromCharCode(n);}throw Error('Original setup string has no terminator');},put=(at:number,value:string)=>{for(let i=0;i<value.length;i++)memory[at+i]=value.charCodeAt(i);memory[at+value.length]=0;};
 const write=(value:string,column:number,row:number,foreground:number,background:number)=>writeOriginalSetupText(screen,Array.from(value,c=>c.charCodeAt(0)),column,row,foreground,background);
 const drawing=createOriginalSetupMenuDrawing(screen,memory);let found=await host.findFirst(text(word(0xaa10))+text(file),0);if(!found)await host.error(0,text(file));
 drawing.helpBar(0x6e0);drawOriginalSetupBox(screen,memory,18,10,20,43,15,64,1);write(text(0x700),12,19,15,64);let result=0;
 for(;;){
  const name=text(file);put(0x977a,text(destination)+(name.startsWith('\\')?'':'\\')+name);let path=text(0x977a),slash=path.lastIndexOf('\\');if(slash>=0)memory[0x977a+slash+1]=0;put(0x977a,text(0x977a)+text(found));
  put(0x9716,text(word(0xaa10))+text(file));path=text(0x9716);slash=path.lastIndexOf('\\');if(slash>=0)memory[0x9716+slash+1]=0;else put(0x9716,text(word(0xaa10)));put(0x9716,text(0x9716)+text(found));
  host.present();result=await host.pollKey();if(result===27)break;
  fillOriginalSetupText(screen,19,26,19,41,0);write(text(word(0xaa10)),26,19,15,0);write(text(found),28,19,15,0);host.present();await host.copyFile(text(0x977a),text(0x9716));found=await host.findNext();if(!found)break;
 }
 drawing.clear(18,10,20,43,112);host.present();return result;
}
