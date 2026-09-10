import {addOriginalTimerCallback} from './add-timer-callback.ts';
export interface NativeRaceEntryHost {
 memory():Uint8Array;randomByte():number;
 loadDemo(mode:number,name:number):Promise<number>;prepareTrack():void;
 initializeResources():Promise<number>;freeResources():void;reportMemoryError():void;
 releaseInput():Promise<void>;showWaiting():void;
}
/** Original1396E..13A3D, including the early demo and resource-failure exits.
 * Success leaves the caller at the simulation/transporter/replay branch. */
export async function enterNativeRace(host:NativeRaceEntryHost,d:number,framePointer:number):Promise<'ready'|'demo-canceled'|'resource-failed'>{
 const word=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+(at&65535),value&65535,true);};
 const byte=(at:number,value:number)=>{host.memory()[d+at]=value&255;};
 word(0x7fe6,0);word(0x7fe8,320);word(framePointer-4,65535);word(0x9000,65535);
 word(0x73da,host.randomByte()<<3);byte(0xa77f,1);byte(0x9aca,0);
 if(host.memory()[d+0x90f8]){
  byte(0x12f,host.memory()[d+0x12f]+1);if(host.memory()[d+0x12f]===4)byte(0x12f,0);
  byte(0xa3c2,2);if((await host.loadDemo(0,0x2ffc))&255)return 'demo-canceled';host.prepareTrack();
 }else{
  const m=host.memory(),length=new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x8fd8,true);
  byte(0x12f,0);byte(0xa3c2,length?2:1);if(length)byte(0x9aca,1);
 }
 if((await host.initializeResources())&65535){
  host.freeResources();host.reportMemoryError();word(0x8a10,100);await host.releaseInput();host.showWaiting();return 'resource-failed';
 }
 byte(0x132,0);byte(0x8ffe,0);byte(0x8ff4,1);
 word(0xaa78,0);addOriginalTimerCallback(host.memory(),d,0x9b8,0x1396);byte(0x8936,0);
 byte(0xa7d8,255);for(const at of [0x8998,0x897c,0xaa77,0x8002])byte(at,0);
 return 'ready';
}
