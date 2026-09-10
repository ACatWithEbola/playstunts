import {freeNativeCockpitResources} from './free-cockpit-resources.ts';
import {freeResource} from './free-resource.ts';
import {updateOriginalCarWheelMemory} from './car-wheel-memory.ts';
export interface NativeRaceResourceCleanupHost {
 memory():Uint8Array;writeMemory(memory:Uint8Array):void;
 freeWindow(offset:number,segment:number):void;removeAudioTimer():void;
}
/** Original156ea..15785, including nested scene, sky, cockpit and wheel
 * cleanup. Released banks use the original high-end resource cache. */
export function freeNativeRaceResources(host:NativeRaceResourceCleanupHost,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+at,true);};
 const exists=(at:number)=>!!(word(at)|word(at+2));
 const release=(at:number)=>{
  const result=freeResource(host.memory(),d,word(at),word(at+2));
  if(result.error)throw Error('Original race resource release failed: '+result.error);
  host.writeMemory(result.memory);
 };
 const window=(at:number)=>host.freeWindow(word(at),word(at+2));
 if(!host.memory()[d+0xaa46+high]&&exists(0x933a+high))window(0x933a+high);
 for(const at of [0xa7d4+high,0xa9e2+high])if(exists(at))release(at);
 if(host.memory()[d+0x130])release(0xa778+high);host.memory()[d+0x130]=0;
 release(0xa9e8+high);release(0x8fbe+high);
 if(!host.memory()[d+0x90f8+high]){
  release(0xa318+high);freeNativeCockpitResources(host,d,mode);
 }
 release(0xa006+high);host.removeAudioTimer();release(0xa41e+high);release(0x9ab8+high);
 const wheels=(opponent:boolean)=>{
  const at=opponent?0x7f5a+middle:0x7f44+middle;
  updateOriginalCarWheelMemory(host.memory(),d,[(word(at)+48)&65535,word(at+2),0,0x2df8,opponent?0x8adc+high:0x8a3a+high,opponent?0x8f16+high:0x8a4c+high,opponent?0x73b4+middle:0x736a+middle]);
 };
 if(exists(0x9ac2+high)){wheels(true);release(0x9ac2+high);}
 wheels(false);release(0x9abc+high);
}
