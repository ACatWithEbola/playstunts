import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
/** Independent native result presentation owner. Logical race/score state stays
 * with the completed race; display bitmaps use the selected original loader. */
export async function prepareNativeDisplayResultsResources(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);};
 const name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const byte=owner.memory()[d+((at+i)&65535)];if(!byte)return value;value+=String.fromCharCode(byte);}throw Error('Unterminated evaluation resource name');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original evaluation resource is unavailable');}};
 let bank:{offset:number;segment:number}|undefined;
 const release=()=>{if(!bank)return;const result=releaseResourcePages(owner.memory(),d,bank.segment);if(result.error)throw Error('Original evaluation resource release failed');owner.writeMemory(result.memory);bank=undefined;};
 return {owner,normalFontSegment:word(0x9adc+high),smallFontSegment:word(0x9338+high),release,
  async evaluation(opponent:number,won:boolean){
   if(!Number.isInteger(opponent)||opponent<1||opponent>6)throw Error('Original evaluation opponent must be 1 through 6');release();const at=won?0x54e:0x556;owner.memory()[d+at+3]=opponent+48;
   const loaded=await loadNativeResource(files,d,3,at,0xee52,mode);if(!loaded)throw Error('Original evaluation resource loading was cancelled');bank=loaded;
   const frame=(key:string)=>{if(!/^op0[0-9]$/.test(key))throw Error('Invalid original evaluation frame');owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);return findOriginalResource(owner.memory(),d,loaded.offset,loaded.segment,0xe800,true)!;};
   return {first:frame('op01'),frame};
  }
 };
}
