import {allocateCarAudio} from './allocate-car-audio.ts';
import {resolveCarAudio,type AudioFarPointer} from './resolve-car-audio.ts';
import {loadSoundEffect} from './load-sound-effect.ts';
/** Original 19066, including resource resolution against caller-owned raw banks. */
export function allocateRawCarAudio(before:Parameters<typeof allocateCarAudio>[0],descriptor:Uint8Array,nameAt:(pointer:AudioFarPointer)=>Uint8Array,sounds:{bank:Uint8Array;voices:Uint8Array;bankAddress:AudioFarPointer;voiceAddress:AudioFarPointer;percussion:readonly AudioFarPointer[]}){
 let bank=sounds.bank.slice(),percussion=sounds.percussion.map(p=>({...p}));
 const resolved=resolveCarAudio(descriptor,nameAt,(name,kind)=>{
  if(kind==='instrument'){
   // 22f15 uses exact names and returns a normalized far pointer, unlike
   // the effect loader's local-bank pointers. Preserve that distinction.
   const view=new DataView(sounds.voices.buffer,sounds.voices.byteOffset,sounds.voices.byteLength),count=view.getUint16(4,true);
   for(let i=0;i<count;i++){
    let match=true;
    for(let j=0;j<4;j++){
     const b=sounds.voices[6+i*4+j];
     if(b===name[j])continue;
     if(b===0&&name[j]===32)break;
     match=false;break;
    }
    if(match){
     const linear=sounds.voiceAddress.segment*16+6+count*8+view.getUint32(6+count*4+i*4,true);
     return {offset:linear&15,segment:(linear>>>4)&65535};
    }
   }
   throw Error('Original required engine instrument was not found');
  }
  const loaded=loadSoundEffect(bank,sounds.voices,name,sounds.bankAddress,sounds.voiceAddress,percussion);
  bank=loaded.bank;percussion=loaded.percussion;
  return loaded.header===null?{offset:0,segment:0}:{offset:(sounds.bankAddress.offset+loaded.header)&65535,segment:sounds.bankAddress.segment};
 });
 const v=new DataView(resolved.buffer),offset=v.getUint16(8,true),segment=v.getUint16(10,true),index=(segment-sounds.voiceAddress.segment)*16+offset-sounds.voiceAddress.offset;
 if(!(offset|segment)||index<0||index+100>sounds.voices.length)throw Error('Car engine instrument is outside its loaded bank');
 const allocated=allocateCarAudio(before,resolved,sounds.voices.slice(index,index+100));
 return {...allocated,bank,percussion};
}
