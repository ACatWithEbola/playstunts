import {loadSelectedNativePvsBank,type NativePvsFileHost} from './load-selected-pvs-bank.ts';
import {initializeOriginalResourceList} from './initialize-resource-list.ts';
/** Successful original F4DE path through kind8: SDGAME2 sprites and widths.
 * File-error dialogs remain owned by the surrounding resource-load service. */
export async function loadNativeRaceSprites(host:NativePvsFileHost,d:number,framePointer:number){
 const pointer=await loadSelectedNativePvsBank(host,d,0x96b,(framePointer-0x2e)&65535,false);
 initializeOriginalRaceSprites(host.memory(),d,pointer);
}
export function initializeOriginalRaceSprites(m:Uint8Array,d:number,pointer:{offset:number;segment:number},mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),word=(at:number)=>v.getUint16(d+at+high,true);
 v.setUint16(d+0xa9e8+high,pointer.offset,true);v.setUint16(d+0xa9ea+high,pointer.segment,true);
 initializeOriginalResourceList(m,d,pointer.offset,pointer.segment,0x973,0xa3cc+high);
 for(let i=0;i<3;i++)v.setUint16(d+0x9c48+high+i*2,v.getUint16(word(0xa3ce+i*4)*16+word(0xa3cc+i*4),true),true);
}
