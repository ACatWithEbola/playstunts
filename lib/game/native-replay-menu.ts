import {originalReplayMenuDisabled} from './replay-menu-disabled.ts';
import {continueNativeReplay,type NativeReplayContinueHost} from './native-replay-continue.ts';
import {runNativeReplayDisplayOptions} from './native-replay-display-options.ts';
import {requestOriginalRaceReplay} from './request-race-replay.ts';

export interface NativeReplayMenuHost extends Omit<NativeReplayContinueHost,'dialog'> {
 continueDriving?(restart:boolean):Promise<boolean>;
 pauseAudio():void;
 dialog(resource:string,mode:number,selected:number,border:number,disabled?:number[]):Promise<number>;
 loadReplay():Promise<void>;saveReplay():Promise<void>;changeGraphics():Promise<void>;
}
/** Original16032..164ef replay-menu coordinator. Resource callbacks must use
 * GAME emen/econ/emdo and the separately scoped file-dialog strings. */
export async function runNativeReplayMenu(host:NativeReplayMenuHost,d:number){
 let m=host.memory();m[d+0x9aca]=1;host.pauseAudio();host.selectControl(2,4,0);
 m=host.memory();let view=new DataView(m.buffer,m.byteOffset,m.byteLength);
 const frame=view.getUint16(d+0x8c26,true);host.selectControl(1,frame,frame);
 m=host.memory();view=new DataView(m.buffer,m.byteOffset,m.byteLength);
 const disabled=originalReplayMenuDisabled(m,d);m[d+0x9ab6]=m[d+0xa003];
 const selected=(await host.dialog('emen',2,0,view.getUint16(d+0x4ec2,true),disabled))<<24>>24;
 switch(selected){
  case 1:case 7:
   m=host.memory();requestOriginalRaceReplay(m,d);if(selected===7)m[d+0x8018]=0;m[d+0x8ff4]=2;break;
  case 2:await (host.continueDriving?host.continueDriving(true):continueNativeReplay(host,d,true));break;
  case 3:await (host.continueDriving?host.continueDriving(false):continueNativeReplay(host,d,false));break;
  case 4:await host.loadReplay();break;
  case 5:await host.saveReplay();break;
  case 6:await runNativeReplayDisplayOptions(host,d);break;
 }
 await host.resetCounter();
}
