import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import {i16} from '../physics/math.ts';
/** Supplied 17A24..17AE0: original linked polygon queue and buffer limits. */
export function enqueueOriginalPrimitiveMemory(memory:Uint8Array,d:number,depth:number,sort:number,layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(p:number)=>v.getInt16(d+(p&65535),true),set=(p:number,n:number)=>v.setInt16(d+(p&65535),n,true);
 let previous=word(layout.address(0xa3a8)),next:number;
 if((sort&65535)===0)next=word(layout.address(0x5590)+previous*2);
 else{
  previous=word(layout.address(0x8000));set(layout.address(0xa3a8),previous);next=word(layout.address(0x5590)+previous*2);let remaining=word(layout.address(0x9b5c));
  while(next>=0){
   if(remaining===0)break;remaining=i16(remaining-1);
   const pointer=layout.address(0x58b2)+next*4,offset=v.getUint16(d+(pointer&65535),true),segment=v.getUint16(d+((pointer+2)&65535),true);
   if(v.getInt16(((segment*16+offset)&0xfffff),true)<i16(depth))break;
   previous=next;set(layout.address(0xa3a8),previous);next=word(layout.address(0x5590)+next*2);
  }
 }
 const index=word(layout.address(0x8938));set(layout.address(0x5590)+index*2,next);set(layout.address(0x5590)+previous*2,index);set(layout.address(0x9b5c),word(layout.address(0x9b5c))+1);
 if(next<0)set(layout.address(0x8a44),index);
 set(layout.address(0xa3a8),word(layout.address(0x5590)+word(layout.address(0xa3a8))*2));set(layout.address(0x8938),index+1);
 set(layout.address(0x5f0a),word(layout.address(0x5f0a))+memory[d+layout.address(0x900a)]*4+6);
 return word(layout.address(0x8938))===400||word(layout.address(0x5f0a))>0x2872?1:0;
}
