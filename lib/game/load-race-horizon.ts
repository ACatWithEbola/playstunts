import {loadSelectedNativePvsBank,type NativePvsFileHost} from './load-selected-pvs-bank.ts';
import {freeResource} from './free-resource.ts';
import {initializeOriginalResourceList} from './initialize-resource-list.ts';
/** Original F3AE: retain an unchanged horizon, or load its original bitmap bank.
 * Bit3 refreshes graphics colors without replacing the resident horizon. */
export async function loadNativeRaceHorizon(host:NativePvsFileHost,d:number,horizon:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+(at&65535),true);};
 const set=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+(at&65535),value&65535,true);};
 horizon&=255;
 if(!(horizon&8)){
  if(host.memory()[d+0x130]&&host.memory()[d+0xa777+high]===horizon)return;
  if(host.memory()[d+0x130]){const freed=freeResource(host.memory(),d,word(0xa778+high),word(0xa77a+high));host.writeMemory(freed.memory);if(freed.error)throw Error('Original horizon release failed: '+freed.error);}
  host.memory()[d+0x130]=0;
  host.memory()[d+0xa777+high]=horizon;host.memory()[d+0x130]=1;
  const signed=(horizon<<24)>>24,pointer=await loadSelectedNativePvsBank(host,d,(0xf4+signed*9)&65535,(framePointer-0x18)&65535,false,mode);
  set(0xa778+high,pointer.offset);set(0xa77a+high,pointer.segment);
  initializeOriginalResourceList(host.memory(),d,pointer.offset,pointer.segment,0x95a,0xa390+high);
  const heights:number[]=[];
  for(let i=0;i<4;i++){const m=host.memory(),view=new DataView(m.buffer,m.byteOffset,m.byteLength),height=view.getUint16(word(0xa392+high+i*4)*16+((word(0xa390+high+i*4)+2)&65535),true);set(0x9b2c+high+i*2,height);heights.push(height);}
  set(0x7fe4+high,Math.min(...heights));set(0x9ae2+high,Math.max(...heights));
 }
 const graphics=word({mcga:0x51ca,cga:0x51ca,tandy:0x52ce,ega:0x52cc}[mode]);set(0x9be2+high,word(graphics+0x22));set(0x909e+high,word(graphics+0x20));set(0xa9f2+high,word(graphics+0xc8));set(0x9372+high,word(0x4e8a));
}
