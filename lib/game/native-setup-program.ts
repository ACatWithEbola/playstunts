import {runOriginalSetup} from './native-setup-runtime.ts';
import {runOriginalSetupInstaller} from './native-setup-installer.ts';
import {createNativeSetupDiskHost} from './native-setup-disk-host.ts';
import {exitOriginalSetupWithError,OriginalSetupExit} from './setup-fatal-error.ts';
import type {createNativeSetupStorage} from './native-setup-storage.ts';
import type {OriginalSetupTextScreen} from './setup-text-screen.ts';
/** One native SETUP invocation. Menu, installer and fatal errors share the
 * same source memory, text screen and retained virtual working directory. */
export async function runNativeSetupProgram(memory:Uint8Array,screen:OriginalSetupTextScreen,storage:Awaited<ReturnType<typeof createNativeSetupStorage>>,io:{key():number|Promise<number>;pollKey():number|Promise<number>;present():void;cursorShape(shape:number):void;bell():void|Promise<void>;detectVideo():number|Promise<number>},options:{browserSettings?:boolean}={}){
 const host={...createNativeSetupDiskHost(memory,storage),...io,error(code:number,path:string){exitOriginalSetupWithError(memory,screen,code,path,io.present);}};
 try{return await runOriginalSetup(memory,screen,{...host,install:async()=>{await runOriginalSetupInstaller(memory,screen,host);}},options);}
 catch(error){if(error instanceof OriginalSetupExit)return error.exitCode;throw error;}
}
