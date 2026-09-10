import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadCompleteNativeShapeResource} from './load-shape-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {initializeOriginalModelDescriptor} from './initialize-model-descriptor.ts';
import {createOriginalIntroDisplay} from './intro-display.ts';
import {originalRandomByte} from './original-random.ts';
import {i16,type Vector} from '../physics/math.ts';
/** Original F548 title models and 100 stars, using caller-owned RNG bytes. */
export async function prepareNativeDisplayIntroResources(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},seed:ReadonlyArray<number>){
 if(seed.length!==6)throw Error('Original intro requires six retained random bytes');
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original intro resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original intro shapes are unavailable');}};
 const bank=await loadCompleteNativeShapeResource(files,d,0x988,0xee52);
 for(const [key,descriptor] of [['logo',0x8982],['log2',0x89be],['brav',0x9304]] as const){owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);const pointer=findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!;initializeOriginalModelDescriptor(owner.memory(),d,pointer,descriptor+high);}
 owner.memory().set(seed,d+0x9f5c+high);const next=()=>originalRandomByte(owner.memory(),d+high),stars=Array.from({length:100},()=>[i16((next()<<7)-16384),i16(-((next()<<7)-5000)),i16((next()<<7)-16384)] as Vector);
 return {owner,stars,get randomState(){return Array.from(owner.memory().subarray(d+0x9f5c+high,d+0x9f62+high));},renderer:createOriginalIntroDisplay(owner.memory,d,mode,owner.drawing,{logo:0x8982+high,log2:0x89be+high,car:0x9304+high,record:0xc900,region:0xca00,stars,rasterScratch:{leftOffset:0xd000,rightOffset:0xd400}})};
}
