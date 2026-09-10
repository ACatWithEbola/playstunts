import {soundResourceOffset} from './sound-resource.ts';
import type {AudioFarPointer} from './resolve-car-audio.ts';
/** Original29f62..2a1ee, local-bank references in sequence commands and headers. */
export function relocateSoundSequences(before:Uint8Array,start:number,address:AudioFarPointer){
 const bank=before.slice(),v=new DataView(bank.buffer),count=v.getUint16(start+4,true),base=start+6+count*8;
 const relocate=(at:number)=>{const target=soundResourceOffset(bank,bank.slice(at,at+4),start);if(target!==null){v.setUint16(at,address.offset+target,true);v.setUint16(at+2,address.segment,true);}};
 for(let i=0;i<count;i++){
  const entry=base+v.getUint32(start+6+count*4+i*4,true),name=String.fromCharCode(...bank.slice(start+6+i*4,start+10+i*4)).toLowerCase();
  if(name==='hdr1'){let p=entry+7+bank[entry+6]*4;const tracks=bank[p++];for(let j=0;j<tracks;j++,p+=5)relocate(p);continue;}
  const end=entry+v.getUint16(entry,true);let p=entry+4;
  while(p<end){
   while(bank[p]&128)p++;p++;
   if(p>=end)throw Error('Incomplete original sound command');
   const op=bank[p];
   if(op===0xe6){p+=2;relocate(p);p+=4;}
   else if(op===0xe7||op===0xe8){p++;const size=bank[p++];p+=size;}
   else if([0xd9,0xda,0xdb,0xe3].includes(op))p++;
   else if([0xdc,0xdd,0xde,0xe0,0xe1,0xe2,0xe4,0xe9,0xea].includes(op))p+=2;
   else if(op===0xdf||op===0xe5)p+=3;
   else{if(op>=128)p++;do{p++;}while(bank[p]&128);p++;}
   if(p>end)throw Error('Sound command exceeds original sequence');
  }
 }
 return bank;
}
