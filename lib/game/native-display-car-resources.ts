import {loadOriginalDisplayColourTables} from './display-colour-tables.ts';
import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {loadCompleteNativeShapeResource} from './load-shape-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {initializeOriginalModelDescriptor} from './initialize-model-descriptor.ts';
import {createOriginalCarModelDisplay} from './car-model-display.ts';
/** Source-loaded car-selection resources and original native model renderer. */
export async function prepareNativeDisplayCarResources(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);},name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const byte=owner.memory()[d+((at+i)&65535)];if(!byte)return value;value+=String.fromCharCode(byte);}throw Error('Unterminated car resource name');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original car-selection resource is unavailable');}};
 owner.memory().set(Array.from('sdcsel\0',c=>c.charCodeAt(0)),d+0xe900);const art=await loadNativeResource(files,d,2,0xe900,0xee52,mode);if(!art)throw Error('Original car artwork loading was cancelled');
 const find=(bank:{offset:number;segment:number},key:string)=>{owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);return findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!;},background=find(art,'stop'),graph=find(art,'grap');
 let model:{offset:number;segment:number}|undefined,portraitBank:{offset:number;segment:number}|undefined,viewWidth=320;
 const release=()=>{if(!model)return;const result=releaseResourcePages(owner.memory(),d,model.segment);if(result.error)throw Error('Original car model release failed');owner.writeMemory(result.memory);model=undefined;};
 return {owner,graph,background,normalFontSegment:word(0x9adc+high),smallFontSegment:word(0x9338+high),release,
  async portrait(opponent:number){
   if(!Number.isInteger(opponent)||opponent<1||opponent>6)throw Error('Original opponent must be 1 through 6');
   if(!portraitBank){owner.memory().set(Array.from('sdosel\0',c=>c.charCodeAt(0)),d+0xe900);const loaded=await loadNativeResource(files,d,8,0xe900,0xee52,mode);if(!loaded)throw Error('Original opponent artwork loading was cancelled');portraitBank=loaded;}
   const picture=find(portraitBank,'opp'+opponent),palette=find(portraitBank,(mode==='cga'?'!cg':'!eg')+opponent);viewWidth=240;
   return ()=>{const m=owner.memory(),start={cga:0x5344,tandy:0x547c,ega:0x53f2}[mode],size=mode==='ega'?512:1024,saved=m.slice(d+start,d+start+size);loadOriginalDisplayColourTables(m,d,mode,(palette.offset+16)&65535,palette.segment);owner.drawing.indexedSprite(picture,{x:240,y:0});m.set(saved,d+start);};
  },
  async car(id:string){
   if(!/^[A-Z0-9]{4}$/.test(id))throw Error('Original car identifier requires four characters');release();owner.memory().set(Array.from('st'+id.toLowerCase()+'\0',c=>c.charCodeAt(0)),d+0xe900);model=await loadCompleteNativeShapeResource(files,d,0xe900,0xee52);
   const shape=find(model,'car0');initializeOriginalModelDescriptor(owner.memory(),d,shape,0xcb00);
   const renderer=createOriginalCarModelDisplay(owner.memory,d,mode,owner.drawing,{descriptor:0xcb00,record:0xc900,region:0xca00,background,rasterScratch:{leftOffset:0xd000,rightOffset:0xd400},viewWidth});
   return {paintCount:owner.memory()[shape.segment*16+shape.offset+2],render:renderer.render};
  }
 };
}
