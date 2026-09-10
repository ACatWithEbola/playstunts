import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {drawOriginalOpponentDisplay} from './opponent-display.ts';
import {captureNativeDisplayRegion} from './native-display-region.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {originalOpponentMenuBounds} from './opponent-menu-raster.ts';
import type {NativeOpponentHost,NativeOpponentPresentation} from './native-opponent-runtime.ts';
/** Source-loaded indexed opponent artwork and selected-driver menu drawing. */
export async function prepareNativeDisplayOpponent(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},host:Pick<NativeOpponentHost,'resources'|'descriptions'>){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);};
 const name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const byte=owner.memory()[d+((at+i)&65535)];if(!byte)return value;value+=String.fromCharCode(byte);}throw Error('Unterminated opponent resource name');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original opponent artwork is unavailable');}};
 owner.memory().set(Array.from('sdosel\0',c=>c.charCodeAt(0)),d+0xe900);const bank=await loadNativeResource(files,d,8,0xe900,0xee52,mode);if(!bank)throw Error('Original opponent artwork loading was cancelled');
 const keys=['scrn','clip',...Array.from({length:8},(_,i)=>(mode==='cga'?'!cg':'!eg')+i),...Array.from({length:7},(_,i)=>'opp'+i)],art=Object.fromEntries(keys.map(key=>{owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);return [key,findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!];})),normal=word(0x9adc+high),small=word(0x9338+high);
 const presentation:NativeOpponentPresentation={
  draw(opponent){restoreOriginalDisplayWindow(owner.memory(),d,mode);new DataView(owner.memory().buffer).setUint16(d+0x4dd2,normal,true);drawOriginalOpponentDisplay(owner.memory(),d,mode,owner.drawing,{art,labels:['ebla','ebnx','ebcl','ebca','ebdo'].map(key=>host.resources[key]),description:host.descriptions[opponent],smallFontSegment:small,textScratch:0xe800},opponent);},
  capture(){return captureNativeDisplayRegion(owner,{x:0,y:0,width:320,height:200});},
  outline(selection,colour){restoreOriginalDisplayWindow(owner.memory(),d,mode);const r=originalOpponentMenuBounds[selection],pattern=word(colour===14?0x4e90:0x4e8e),draw=owner.drawing;draw.rectangle(r.left,r.top,r.right-r.left+1,1,pattern);draw.rectangle(r.left,r.bottom,r.right-r.left+1,1,pattern);draw.rectangle(r.left,r.top,1,r.bottom-r.top+1,pattern);draw.rectangle(r.right,r.top,1,r.bottom-r.top+1,pattern);}
 };
 return {owner,presentation};
}
