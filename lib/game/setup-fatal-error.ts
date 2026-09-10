import {fillOriginalSetupText,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
export class OriginalSetupExit extends Error {
 readonly exitCode:number;
 constructor(exitCode:number){super(`Original SETUP exited with code ${exitCode}`);this.name='OriginalSetupExit';this.exitCode=exitCode;}
}
/** Source08F2 resets text mode, shows its file error and exits immediately.
 * It does not wait for a dismissal key or return to a caller's copy loop. */
export function exitOriginalSetupWithError(memory:Uint8Array,screen:OriginalSetupTextScreen,code:number,path:string,present:()=>void):never {
 const word=(at:number)=>memory[at]|memory[at+1]<<8,text=(at:number)=>{const out:number[]=[];for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out.push(n);}throw Error('Original setup error string has no terminator');};
 screen.column=0;screen.row=0;fillOriginalSetupText(screen,0,0,24,79,0);fillOriginalSetupText(screen,0,0,0,79,64);code=code<<16>>16;
 if(code>=0&&code<8){const value=[...text(0x10d8),...Array.from(path,c=>c.charCodeAt(0)&255),...text(0x10e0),...text(code===6?0x10e4:0x10f0),...text(0x10f6),...text(word(0x36c+code*2))];memory.set([...value,0],0x97de);writeOriginalSetupText(screen,value,1,0,15,64);}
 screen.column=0;screen.row=1;present();throw new OriginalSetupExit(code&255);
}
