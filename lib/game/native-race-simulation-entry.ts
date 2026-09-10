import {originalStartTruckEntry} from './start-truck-entry.ts';
import type {Vector} from '../physics/math.ts';
export interface NativeRaceSimulationEntryHost {
 memory():Uint8Array;initialize(mode:number):void;resetMouse(mode:number):void;
 seekReplay(frame:number):void;stepReplay():void;key(mode:number):Promise<number>;
}
/** Original13A3E..13B53. Prepare demo simulation, transporter rollout, or
 * fast-forward an existing replay; Escape interrupts only the fast-forward. */
export async function enterNativeRaceSimulation(host:NativeRaceSimulationEntryHost,d:number){
 const byte=(at:number,value:number)=>{host.memory()[d+at]=value&255;};
 const view=()=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number,value:number)=>view().setUint16(d+at,value&65535,true);
 if(host.memory()[d+0x90f8]){host.initialize(-1);return 'demo' as const;}
 if(!host.memory()[d+0x9aca]){
  byte(0x12f,0);byte(0x8002,1);byte(0x8fbd,0);host.initialize(-1);
  word(0xa3a4,0);byte(0xa34e,0);byte(0x7fee,1);
  const mouse=host.memory()[d+0x12c];host.resetMouse((mouse<<24)>>24);byte(0xa3c2,1);
  const v=view(),position=[0,1,2].map(a=>v.getInt32(d+0x8c38+a*4,true)) as Vector;
  const entry=originalStartTruckEntry(position,v.getInt16(d+0x9b2a,true));
  entry.position.forEach((value,a)=>v.setInt32(d+0x8c38+a*4,value,true));byte(0x8018,entry.flags);
  return 'transporter' as const;
 }
 byte(0x12f,0);byte(0xa3c2,2);word(0x93dc,500);
 host.seekReplay(0);host.seekReplay(view().getUint16(d+0x8fd8,true));
 while(view().getUint16(d+0x8c26,true)!==view().getUint16(d+0x8fd8,true)){
  if(((await host.key(1))&65535)===27)break;host.stepReplay();
 }
 word(0x73b2,view().getUint16(d+0x8fd8,true));return 'replay' as const;
}
