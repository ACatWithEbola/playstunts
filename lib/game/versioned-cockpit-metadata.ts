import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
/** Verified MS91 STDAJAGU ins3 header only; never rewrite source bank/pixels. */
export function applyVersionedCockpitMetadata(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega',engine?:PhysicsEngineVersion){
 if(engine==='bb-1991')return;
 const at=COCKPIT_DISPLAY_LAYOUTS[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 if(memory[d+0x90f8+high])return; // Dashboard-disabled races have no instrument bank.
 if(String.fromCharCode(...memory.subarray(d+at(0x8fc2),d+at(0x8fc2)+4))!=='JAGU')return;
 const pointer=d+at(0x5482),offset=v.getUint16(pointer,true),segment=v.getUint16(pointer+2,true);
 const word=(field:number)=>segment*16+((offset+field)&65535);
 const x=v.getUint16(word(8),true),y=v.getUint16(word(10),true);
 if(!((x===136&&y===148)||(x===0&&y===0)))throw Error('Unexpected Jaguar instrument metadata');
 const modern=engine==='ms-1991';
 v.setUint16(word(8),modern?0:136,true);v.setUint16(word(10),modern?0:148,true);
}
