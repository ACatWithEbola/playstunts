import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {allocateOriginalDisplayWindow,freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {originalTitleCards,type OriginalTitleCardRequest} from './title-cards.ts';
import {originalSpritePresentation} from './sprite-presentation.ts';
/** Original title-card flow with a source-loaded bank and native backing window. */
export async function prepareNativeDisplayTitleCards(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},present:()=>void=()=>{}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original title resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original title artwork is unavailable');}};
 owner.memory().set(Array.from('sdtitl\0',c=>c.charCodeAt(0)),d+0xe900);const bank=await loadNativeResource(files,d,2,0xe900,0xee52,mode);if(!bank)throw Error('Original title resource loading was cancelled');
 const cards=Object.fromEntries(['prod','titl'].map(key=>{owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);return [key,findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!];}));
 const allocated=allocateOriginalDisplayWindow(owner.memory(),d,mode,320,200);if(allocated.error||!allocated.window)throw Error('Original title window allocation failed: '+allocated.error);owner.writeMemory(allocated.memory);const window=allocated.window,bitmap={offset:0,segment:allocated.segment};let selected=cards.prod,closed=false;
 const video=()=>restoreOriginalDisplayWindow(owner.memory(),d,mode),back=()=>owner.drawing.selectWindow(window);
 return {owner,cards,bitmap,
  *titles():Generator<OriginalTitleCardRequest,number,number>{const flow=originalTitleCards({hideMouse(){},showMouse(){},clearVideo(){video();owner.drawing.clearWindow(0);present();},clearWindow(){back();owner.drawing.clearWindow(0);},locate(key){selected=cards[key];const at=selected.segment*16+selected.offset;return owner.memory()[at+10]|owner.memory()[at+11]<<8;},draw(){back();owner.drawing.unclippedBitmap(selected);}});let step=flow.next();while(!step.done){const high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode];new DataView(owner.memory().buffer).setUint16(d+0x8a10+high,step.value.waitFlag,true);step=flow.next(yield step.value);}return step.value;},
  presentation(value:number){return originalSpritePresentation({selectVideo:video,hideMouse(){},showMouse(){},drawWhole(){owner.drawing.unclippedBitmap(bitmap);present();},drawPass(pass){owner.drawing.reveal(bitmap,pass);present();}},value);},
  release(){if(closed)return;closed=true;video();const freed=freeOriginalDisplayWindow(owner.memory(),d,mode,window.offset,window.segment);if(freed.error)throw Error('Original title window release failed: '+freed.error);owner.writeMemory(freed.memory);}
 };
}
