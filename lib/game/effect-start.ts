import {allocateEffectVoice} from './effect-allocation.ts';
export interface EffectStartInput {
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
 if(timers.length!==24||timers.some(t=>t.length!==72)||input.busy.length!==24||lastNotes.length!==24||markers.length!==24)throw Error('Invalid original effect timer pool');
 let voice=input.requested;
 if(voice===-1)voice=allocateEffectVoice(timers.slice(16).map((t,i)=>({resource:view(t).getUint32(0,true),busy:input.busy[i+16]})));
 if(voice===-1)return result(-1);
 if(!Number.isInteger(voice)||voice<16||voice>23)throw Error('Unsupported explicit effect voice');
 if((input.headerOffset|input.headerSegment)===0||input.header[5]!==1)return result(-1);
 const count=input.header[6];
 if(count===undefined||count>=128||input.header.length<4*count+12)throw Error('Unreconstructed effect header layout');
 const timer=timers[voice],v=view(timer),header=view(input.header);
 // Original shifts in AX before unsigned division, then decrements. Zero
 // volume with nonzero master becomes ff after the original byte store.
 const volume=input.master?((Math.floor(((input.volume<<7)&65535)/(input.master&255))-1)&255):0;
 for(const [offset,value] of [[0x22,127],[0x23,voice],[0x16,15],[0x32,0],[4,0],[0x24,input.priority],[0x15,0],[0x1c,0],[0x28,volume],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[offset]=value;
 for(const offset of [0x18,0x1a,0x1e,0x20,0x26])v.setUint16(offset,0,true);
 const sequence=(header.getUint32(4*count+8,true)+4)>>>0;
 v.setUint32(0,sequence,true);v.setUint32(5,sequence,true);
 v.setUint16(0x2e,input.headerOffset+7,true);v.setUint16(0x30,input.headerSegment,true);
 lastNotes[voice]=0;markers[voice]=0;
 return result(voice);
}
