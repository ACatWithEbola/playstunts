import {addOriginalTimerCallback} from './add-timer-callback.ts';
export interface LoadedAudioPointer {offset:number;segment:number}
export interface LoadedAudioDriverHost {
 memory():Uint8Array;
 initializeDriver(pointer:LoadedAudioPointer):number|Promise<number>;
 resetAudio():void|Promise<void>;
 loadPatch(name:number):Promise<LoadedAudioPointer>;
 installPatch(pointer:LoadedAudioPointer):void|Promise<void>;
 freePatch(pointer:LoadedAudioPointer):void;
 alternateCommand(command:number,data:number):void|Promise<void>;
}
/** Original 29770..29846, after the selected driver has been loaded.
 * Native device backends implement driver calls; no DOS code is executed. */
export async function initializeLoadedAudioDriver(host:LoadedAudioDriverHost,d:number,pointer:LoadedAudioPointer):Promise<0|1|2>{
 const put=(at:number,n:number)=>{host.memory()[d+at]=n&255;};
 const word=(at:number,n:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+at,n&65535,true);};
 const loaded={offset:pointer.offset&65535,segment:pointer.segment&65535};
 word(0x4ddc,loaded.offset);word(0x4dde,loaded.segment);put(0x9f62,127);put(0x9f5a,127);
 if(!(loaded.offset|loaded.segment))return 1;
 const voices=(await host.initializeDriver(loaded))&255;put(0x9fe4,voices);
 if(voices===0||voices===255)return 2;
 if(voices>127){put(0x9fe4,16);put(0x4e06,1);put(0x4e07,0);}
 await host.resetAudio();addOriginalTimerCallback(host.memory(),d,0,0x2a1f);
 if(host.memory()[d+0x4e06]){
  const patch=await host.loadPatch(0x4e13);
  const normalized={offset:patch.offset&65535,segment:patch.segment&65535};
  if(normalized.offset|normalized.segment){await host.installPatch(normalized);host.freePatch(normalized);put(0x4e0b,100);await host.alternateCommand(4,0x4e08);}
 }
 return 0;
}
