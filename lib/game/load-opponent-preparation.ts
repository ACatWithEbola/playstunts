import {loadCompleteNativeGameResource} from './load-complete-game-resource.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {copyOriginalResourceString} from './initialize-car-resource.ts';
import {prepareOpponentPathMemory} from './prepare-opponent-path-memory.ts';
import {freeResource} from './free-resource.ts';
/** Original135be..1384d: load opponent name and speed profile, choose the
 * least-cost route from live route tables, then cache the opponent bank. */
export async function loadNativeOpponentPreparation(host:NativeRawResourceHost&{retry():Promise<number>},d:number,bp:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 host.memory()[d+0x141]=(host.memory()[d+0x8fc8+high]+48)&255;
 const resource=await loadCompleteNativeGameResource(host,d,0x13e,(bp-0xf3c)&65535);
 let memory=host.memory();
 // The localized lookup constructs aa6e + the three letters of "nam".
 // This local belongs to the nested resource lookup's original frame.
 const nameLocal=(bp-0xf44)&65535;
 memory[d+nameLocal]=memory[d+0xaa6e+high];for(let i=0;i<3;i++)memory[d+((nameLocal+1+i)&65535)]=memory[d+0x2f89+i];
 const name=findOriginalResource(memory,d,resource.offset,resource.segment,nameLocal,true)!;
 copyOriginalResourceString(memory,d,0xaa74+high,name.offset,name.segment);
 findOriginalResource(memory,d,resource.offset,resource.segment,0x2f8d,true);
 findOriginalResource(memory,d,resource.offset,resource.segment,0x2f92,true);
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>view.getUint16(d+at,true);
 const routeWords=(at:number)=>Array.from({length:901},(_,i)=>view.getUint16(word(at+2)*16+((word(at)+i*2)&65535),true));
 const tiles=Array.from({length:901},(_,i)=>memory[word(0x8ff0+high)*16+((word(0x8fee+high)+i)&65535)]);
 const address=resource.segment*16+resource.offset,size=view.getUint32(address,true);
 const prepared=prepareOpponentPathMemory(memory,d,address,size,{primary:routeWords(0x73d2+middle),secondary:routeWords(0x7f9a+middle),tiles},mode);
 memory=prepared.memory;
 const released=freeResource(memory,d,resource.offset,resource.segment);host.writeMemory(released.memory);
 if(released.error)throw Error('Original opponent resource release failed: '+released.error);
 return prepared.path;
}
