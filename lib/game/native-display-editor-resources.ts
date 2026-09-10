import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {allocateOriginalDisplayWindow,freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {OriginalEditorDisplayScreenResources} from './editor-display-screen.ts';
/** Fresh original editor bitmap bank and native cursor windows. */
export async function prepareNativeDisplayEditorResources(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},data:Pick<OriginalEditorDisplayScreenResources,'pages'|'objects'|'art'|'terrainNames'|'text'>){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original editor resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original editor artwork is unavailable');}};
 owner.memory().set(Array.from('sdtedit\0',c=>c.charCodeAt(0)),d+0xe900);const bank=await loadNativeResource(files,d,2,0xe900,0xee52,mode);if(!bank)throw Error('Original editor resource loading was cancelled');
 const keys=new Set([...data.art.flatMap(a=>[a.small,a.large]),...data.terrainNames,'crs0','crs1','crs2','crs3']),images:OriginalEditorDisplayScreenResources['images']={};
 for(const key of keys){owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);images[key]=findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!;}
 const windows:{offset:number;segment:number}[]=[],cursorWindows:{offset:number;segment:number}[]=[],cursorBitmaps:{offset:number;segment:number}[]=[],backgrounds:{offset:number;segment:number}[]=[];
 const release=()=>{restoreOriginalDisplayWindow(owner.memory(),d,mode);while(windows.length){const pointer=windows.pop()!,freed=freeOriginalDisplayWindow(owner.memory(),d,mode,pointer.offset,pointer.segment);if(freed.error)throw Error('Original editor window release failed: '+freed.error);owner.writeMemory(freed.memory);}};
 try{for(const [width,height] of [[16,16],[16,32],[32,16],[32,32]])for(let background=0;background<2;background++){
  const allocated=allocateOriginalDisplayWindow(owner.memory(),d,mode,width,height);if(allocated.error||!allocated.window)throw Error('Original editor cursor allocation failed: '+allocated.error);owner.writeMemory(allocated.memory);windows.push(allocated.window);
  const bitmap={offset:0,segment:allocated.segment};if(background)backgrounds.push(bitmap);else{cursorWindows.push(allocated.window);cursorBitmaps.push(bitmap);}
 }}catch(error){release();throw error;}
 restoreOriginalDisplayWindow(owner.memory(),d,mode);const active={cga:0x6862,tandy:0x63d2,ega:0x9112}[mode];owner.memory().set(owner.memory().subarray(0x209e0+active,0x209e0+active+30),d+0xe700);
 return {owner,resources:{...data,images,screenWindow:{offset:0xe700,segment:d>>>4},cursorWindows,cursorBitmaps,backgrounds,textScratch:0xe800},release};
}
