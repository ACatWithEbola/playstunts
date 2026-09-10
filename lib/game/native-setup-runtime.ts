import {adaptBrowserSetupMenu} from './browser-setup-menu.ts';
import {initializeOriginalSetupMenus} from './initialize-setup-menus.ts';
import {loadOriginalSetupConfiguration,saveOriginalSetupConfiguration,type OriginalSetupConfigurationHost,type OriginalSetupSaveHost} from './native-setup-configuration.ts';
import {runOriginalSetupMenu} from './native-setup-menu.ts';
import {createOriginalSetupMenuDrawing,fillOriginalSetupText,writeOriginalSetupText,type OriginalSetupTextScreen} from './setup-text-screen.ts';
export interface OriginalSetupHost extends OriginalSetupConfigurationHost,OriginalSetupSaveHost {
 key():number|Promise<number>;present():void;cursorShape(shape:number):void;install():void|Promise<void>;
}
/** Supplied SETUP15A8..1609. Escape leaves without saving; Exit saves.
 * Disk installation is a separate original subprogram supplied by the host. */
export async function runOriginalSetup(memory:Uint8Array,screen:OriginalSetupTextScreen,host:OriginalSetupHost,options:{browserSettings?:boolean}={}){
 initializeOriginalSetupMenus(memory);await loadOriginalSetupConfiguration(memory,host);
 if(options.browserSettings)adaptBrowserSetupMenu(memory);
 screen.column=0;screen.row=0;fillOriginalSetupText(screen,0,0,24,79,0x70);host.cursorShape(0x2000);
 const drawing=createOriginalSetupMenuDrawing(screen,memory);drawing.drawHeader();host.present();
 const menuHost={key:host.key,drawMenu(descriptor:number,selected:number){drawing.drawMenu(descriptor,selected);host.present();},drawEntry(descriptor:number,entry:number,selected:number){drawing.drawEntry(descriptor,entry,selected);host.present();},help:(pointer:number)=>drawing.help(pointer,host.key,host.present),helpBar(pointer:number){drawing.helpBar(pointer);host.present();},clear(...args:Parameters<typeof drawing.clear>){drawing.clear(...args);host.present();}};
 for(;;){
  const action=await runOriginalSetupMenu(memory,0x19a,menuHost);
  if(action===-1)break;
  if(action===5){await host.install();await saveOriginalSetupConfiguration(memory,host);}
  else if(action===6){await saveOriginalSetupConfiguration(memory,host);break;}
 }
 // Original1560 resets text mode and leaves its launch instruction on row0.
 screen.column=0;screen.row=0;fillOriginalSetupText(screen,0,0,24,79,0);fillOriginalSetupText(screen,0,0,0,79,16);
 const text:number[]=[];if(options.browserSettings)text.push(...Array.from('Return to Stunts to play.',c=>c.charCodeAt(0)));else for(let at=0x1548;memory[at];at++)text.push(memory[at]);writeOriginalSetupText(screen,text,1,0,15,16);screen.column=0;screen.row=1;host.present();return 0;
}
