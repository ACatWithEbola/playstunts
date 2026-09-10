import {initializeOriginalProjection} from './initialize-projection.ts';
import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeSceneShapes} from './load-scene-shapes.ts';
import {loadNativeRaceHorizon} from './load-race-horizon.ts';
import {drawOriginalTrackOverviewDisplay} from './track-overview-display.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
/** Original scene models, persistent track buffers and selected landscape bank.
 * Each owner loads its resources independently of the MCGA driving baseline. */
export async function prepareNativeDisplayTrackResources(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original track resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original track scene resource is unavailable');}};
 if(await loadNativeSceneShapes(files,d,0xeefe,mode))throw Error('Original scene model allocation failed');
 return {owner,async draw(raw:ReadonlyArray<number>){
  if(raw.length!==1802)throw Error('Original track requires 1802 bytes');
  const m=owner.memory(),v=new DataView(m.buffer),word=(at:number)=>v.getUint16(d+at+high,true);
  m.set(raw.slice(0,900),word(0x9358)*16+word(0x9356));m.set(raw.slice(901,1801),word(0x9ad2)*16+word(0x9ad0));
  await loadNativeRaceHorizon({...files,async read(at:number){const data=await files.readFile(at);if(!data)throw Error('Original landscape is unavailable');return data;}},d,raw[900],0xeefe,mode);
  const current=owner.memory(),view=new DataView(current.buffer);view.setUint16(d+0x4b84,0,true);view.setUint16(d+0x4b86,0,true);initializeOriginalProjection(current,d,40,40,320,200);
  restoreOriginalDisplayWindow(current,d,mode);
  return drawOriginalTrackOverviewDisplay(owner.memory(),d,mode,owner.drawing,{record:0xc900,region:0xca00,leftOffset:0xd000,rightOffset:0xd400});
 }};
}
