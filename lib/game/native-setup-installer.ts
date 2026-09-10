import {createOriginalSetupInstallPrompts,type OriginalSetupPromptHost} from './setup-install-prompts.ts';
import {installOriginalSetup,prepareOriginalSetupDirectory} from './setup-install-flow.ts';
import {requestOriginalSetupDisk,installOriginalSetupDiskFiles} from './setup-install-disk.ts';
import {copyOriginalSetupFiles} from './setup-copy-files.ts';
import {copyOriginalSetupFile,type OriginalSetupCopyHost} from './setup-file-copy.ts';
import type {OriginalSetupTextScreen} from './setup-text-screen.ts';
export interface OriginalSetupInstallerHost extends OriginalSetupPromptHost,OriginalSetupCopyHost {
 findFirst(path:string,attribute:number):number|Promise<number>;findNext():number|Promise<number>;
 makeDirectory(path:string):number|Promise<number>;changeDrive(drive:number):number|Promise<number>;changeDirectory(path:string):number|Promise<number>;
 pollKey():number|Promise<number>;
}
/** Native composition of supplied SETUP0E2A, including actual dialogs, media
 * checks, wildcard enumeration and block copying. The host owns virtual DOS I/O. */
export async function runOriginalSetupInstaller(memory:Uint8Array,screen:OriginalSetupTextScreen,host:OriginalSetupInstallerHost){
 const prompts=createOriginalSetupInstallPrompts(memory,screen,host);
 const prepareDirectory=(destination:number,file:number)=>prepareOriginalSetupDirectory(memory,destination,file,{exists:(path,attribute)=>host.findFirst(path,attribute),makeDirectory:path=>host.makeDirectory(path)});
 return installOriginalSetup(memory,{
  destination:prompts.destination,message:prompts.message,prepareDirectory,
  installDisk:(index,destination,files)=>installOriginalSetupDiskFiles(memory,index,destination,files,{
   requestDisk:disk=>requestOriginalSetupDisk(memory,screen,disk,{key:()=>host.key(),present:()=>host.present(),cursorShape:shape=>host.cursorShape(shape),bell:()=>host.bell(),exists:(path,attribute)=>host.findFirst(path,attribute)}),
   prepareDirectory,error:(code,path)=>host.error(code,path),
   copyFiles:(to,file)=>copyOriginalSetupFiles(memory,screen,to,file,{findFirst:(path,attribute)=>host.findFirst(path,attribute),findNext:()=>host.findNext(),pollKey:()=>host.pollKey(),present:()=>host.present(),error:(code,path)=>host.error(code,path),copyFile:(target,source)=>copyOriginalSetupFile(memory,target,source,host)})
  }),
  changeDrive:drive=>host.changeDrive(drive),changeDirectory:path=>host.changeDirectory(path)
 });
}
