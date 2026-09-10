import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {allocateOriginalDisplayWindow,freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {originalIntroCredits} from './intro-credits.ts';
import {originalSpritePresentation} from './sprite-presentation.ts';
import {drawOriginalCreditsDisplayText,originalCreditsTextLayout} from './credits-display-text.ts';
/** Original credits resources and 2F62..3717 drawing/input flow. */
export async function prepareNativeDisplayCredits(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},present:()=>void=()=>{}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),{d,drawing}=owner;
 const name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original credits resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original credits resources are unavailable');}};
 const load=async(kind:number,name:string)=>{owner.memory().set(Array.from(name+'\0',c=>c.charCodeAt(0)),d+0xe900);const bank=await loadNativeResource(files,d,kind,0xe900,0xee52,mode);if(!bank)throw Error('Original credits loading was cancelled');return bank;};
 const artBank=await load(2,'sdcred'),textBank=await load(0,'cred.res');
 const locate=(bank:typeof artBank,key:string)=>{owner.memory().set(Array.from(key,c=>c.charCodeAt(0)),d+0xe800);return findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0xe800,true)!;};
 const art=['arow','arrw','arw1','arw2','arw3','arw4','arw5','arw6','arw7','arw8','type'].map(key=>locate(artBank,key)),resources:Record<string,number[]>={};
 for(const [key] of originalCreditsTextLayout){const pointer=locate(textBank,key),at=pointer.segment*16+pointer.offset,bytes:number[]=[];for(let i=0;i<65536;i++){const byte=owner.memory()[at+i];bytes.push(byte);if(!byte)break;}resources[key]=bytes;}
 const allocated=allocateOriginalDisplayWindow(owner.memory(),d,mode,320,200);if(allocated.error||!allocated.window)throw Error('Original credits window allocation failed: '+allocated.error);owner.writeMemory(allocated.memory);
 const bitmap={offset:0,segment:allocated.segment},window=allocated.window,video=()=>restoreOriginalDisplayWindow(owner.memory(),d,mode),back=()=>drawing.selectWindow(window);let closed=false;
 const header=(index:number)=>{const at=art[index].segment*16+art[index].offset,v=new DataView(owner.memory().buffer);return {x:v.getInt16(at+8,true),y:v.getInt16(at+10,true),width:v.getUint16(at,true)*({cga:4,tandy:2,ega:8}[mode]),height:v.getUint16(at+2,true)};};
 back();drawing.clearWindow(0);video();drawing.clearWindow(0);
 new DataView(owner.memory().buffer).setUint16(d+0x8a10+({cga:0x5e0,tandy:0x620,ega:0x45c}[mode]),150,true);
 return {owner,resources,art,bitmap,
  credits(){return originalIntroCredits({arrow:header(1),finalY:header(0).y,
   drawText(){back();drawOriginalCreditsDisplayText(owner.memory(),d,drawing,resources,0xe800);},
   slide(x,y,width,height){video();drawing.bitmap(art[1],{x,y});drawing.rectangle(x+width,y,32,height,0);present();},
   frame(index,y){back();drawing.bounds(0,320,y,200);drawing.clearWindow(0);drawing.unclippedBitmap(art[index]);video();drawing.bounds(0,320,y,200);drawing.bitmap(bitmap);present();},
   finish(y){video();drawing.bounds(0,320,0,200);drawing.capture(bitmap);back();drawing.bounds(0,320,y,200);drawing.clearWindow(0);drawing.unclippedBitmap(art[0]);drawing.unclippedBitmap(art[10]);}
  });},
  presentation(mode:number){return originalSpritePresentation({selectVideo:video,hideMouse(){},showMouse(){},drawWhole(){drawing.unclippedBitmap(bitmap);present();},drawPass(pass){drawing.reveal(bitmap,pass);present();}},mode);},
  release(){if(closed)return;closed=true;video();const freed=freeOriginalDisplayWindow(owner.memory(),d,mode,window.offset,window.segment);if(freed.error)throw Error('Original credits window release failed: '+freed.error);owner.writeMemory(freed.memory);}
 };
}
