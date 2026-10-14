import {allocateEffectVoice} from './effect-allocation.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface EffectStartInput {
 physicsEngine?:PhysicsEngineVersion;
 enabled:boolean;master:number;volume:number;priority:number;requested:number;
 headerOffset:number;headerSegment:number;header:Uint8Array;
 timers:Uint8Array[];busy:number[];lastNotes:Uint8Array;markers:Uint8Array;
}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
/** Original 0x29334 plus single-effect timer initialization at 0x29b02.
 * Header must be the loaded resource: instrument and sequence names have
 * already been replaced by their original far pointers, and byte 5 is one.
 */
export function startEffect(input:EffectStartInput){
 const timers=input.timers.map(t=>t.slice()),lastNotes=input.lastNotes.slice(),markers=input.markers.slice();
 const result=(voice:number)=>({voice,timers,lastNotes,markers});
 if(!input.enabled)return result(-1);
 const modern=input.physicsEngine==='ms-1991';
 const invalidResource=(input.headerOffset|input.headerSegment)===0||input.header[5]!==1;
 // MS91 validates the loaded resource before it searches/selects a voice.
 if(modern&&invalidResource)return result(-1);
 const timerSize=timers[0]?.length;
 // Existing race adapters use the 72-byte canonical shared fields. The
 // complete MS91 representation retains its additional two words as well.
 if(timers.length!==24||!(timerSize===72||(modern&&timerSize===76))||timers.some(t=>t.length!==timerSize)||input.busy.length!==24||lastNotes.length!==24||markers.length!==24)throw Error('Invalid original effect timer pool');
 let voice=input.requested;
 if(voice===-1)voice=allocateEffectVoice(timers.slice(16).map((t,i)=>({resource:view(t).getUint32(0,true),busy:input.busy[i+16]})));
 if(voice===-1)return result(-1);
 if(!Number.isInteger(voice)||voice<16||voice>23)throw Error('Unsupported explicit effect voice');
 if(invalidResource)return result(-1);
 const count=input.header[6];
 if(count===undefined||(!modern&&count>=128)||input.header.length<4*count+12)throw Error('Unreconstructed effect header layout');
 const timer=timers[voice],v=view(timer),header=view(input.header);
 // Original shifts in AX before unsigned division, then decrements. Zero
 // volume with nonzero master becomes ff after the original byte store.
 const volume=input.master?((Math.floor(((input.volume<<7)&65535)/(input.master&255))-1)&255):0;
 for(const [offset,value] of [[0x22,127],[0x23,voice],[0x16,15],[0x32,0],[4,0],[0x24,input.priority],[0x15,0],[0x1c,0],[0x28,volume],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[offset]=value;
 for(const offset of [0x18,0x1a,0x1e,0x20,0x26])v.setUint16(offset,0,true);
 if(modern&&timerSize===76)v.setUint32(0x48,0,true);
 const rawSequence=header.getUint32(4*count+8,true);
 // MS91 loads the far pointer then ADDs AX only; legacy ADD/ADC carries
 // offset overflow into the segment. Keep the absent-version legacy default.
 const sequence=modern
  ?((rawSequence&0xffff0000)|(((rawSequence&65535)+4)&65535))>>>0
  :(rawSequence+4)>>>0;
 v.setUint32(0,sequence,true);v.setUint32(5,sequence,true);
 v.setUint16(0x2e,input.headerOffset+7,true);v.setUint16(0x30,input.headerSegment,true);
 lastNotes[voice]=0;markers[voice]=0;
 return result(voice);
}
