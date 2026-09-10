import {initializeCarRenderBank} from './initialize-same-car-render-bank.ts';
/** Install already decoded original banks in independent native render memory.
 * A missing opponent leaves its original retained descriptors untouched, as
 * the supplied FE4E branch does for the FF car sentinel. */
export function initializeSelectedCarRenderBanks(memory:Uint8Array,d:number,player:Uint8Array,opponent?:Uint8Array){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const install=(bank:Uint8Array,segment:number,other:boolean)=>{
  if(bank.length<6||bank.length>65535||segment*16+bank.length>memory.length)throw Error('Invalid original car render bank');
  memory.set(bank,segment*16);const pointer=other?0x9ac2:0x9abc;view.setUint16(d+pointer,0,true);view.setUint16(d+pointer+2,segment,true);initializeCarRenderBank(memory,d,0,segment,other);
 };
 install(player,0xa000,false);if(opponent)install(opponent,0xb000,true);
}
