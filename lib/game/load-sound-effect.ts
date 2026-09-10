import {soundResourceOffset} from './sound-resource.ts';
import {loadPercussionInstruments} from './load-percussion-instruments.ts';
import {relocateSoundSequences} from './relocate-sound-sequences.ts';
import type {AudioFarPointer} from './resolve-car-audio.ts';
const key=(text:string)=>Uint8Array.from(text,c=>c.charCodeAt(0));
/** Original 28f06: find effect, resolve instruments, relocate sequences, mark loaded. */
export function loadSoundEffect(before:Uint8Array,voices:Uint8Array,name:Uint8Array,bankAddress:AudioFarPointer,voiceAddress:AudioFarPointer,beforePercussion:readonly AudioFarPointer[]){
 let bank=before.slice();
 const percussion=beforePercussion.map(pointer=>({...pointer}));
 const container=soundResourceOffset(bank,name);if(container===null)return {bank,header:null,percussion};
 const header=soundResourceOffset(bank,key('hdr1'),container);if(header===null)return {bank,header:null,percussion};
 if(bank[header+5]===1)return {bank,header,percussion};
 const v=new DataView(bank.buffer),count=bank[header+6];
 for(let i=0;i<count;i++){
  const at=header+7+i*4,target=soundResourceOffset(voices,bank.slice(at,at+4));
  v.setUint16(at,target===null?0:voiceAddress.offset+target,true);
  v.setUint16(at+2,target===null?0:voiceAddress.segment,true);
 }
 const loadedPercussion=loadPercussionInstruments(voices,voiceAddress);
 bank=relocateSoundSequences(bank,container,bankAddress);
 const loaded=new DataView(bank.buffer);
 bank[header+5]=1;
 loaded.setUint16(header,bankAddress.offset+container+1+bank[container+4]*8,true);
 loaded.setUint16(header+2,bankAddress.segment,true);
 return {bank,header,percussion:loadedPercussion};
}
