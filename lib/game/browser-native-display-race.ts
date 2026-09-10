import {prepareNativeDisplayMainMenu} from './native-display-main-menu.ts';
import {createNativeDisplayCommonState} from './native-display-common-state.ts';
import {prepareNativeDisplayEditorResources} from './native-display-editor-resources.ts';
import {prepareNativeDisplayTrackResources} from './native-display-track-resources.ts';
import {prepareNativeDisplayOpponent} from './native-display-opponent.ts';
import type {NativeOpponentHost} from './native-opponent-runtime.ts';
import {prepareNativeDisplayCarResources} from './native-display-car-resources.ts';
import {prepareNativeDisplayResultsResources} from './native-display-results-resources.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import {prepareNativeManualDisplay} from './native-manual-display.ts';
import {prepareNativeDisplayRace} from './prepare-native-display-race.ts';
import {decodeEgaDisplayPalette,egaPaletteRgb} from './ega-display-palette.ts';
import {prepareOriginalRaceViewport} from './race-viewport.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';

export type NativeBrowserDisplayMode='cga'|'tandy'|'ega';
type InitialData={segment:number;data:string;displayData:Array<{offset:number;data:string}>};
export function decodeNativeInitialDisplayData(source:InitialData){
 const bytes=(hex:string)=>{if(hex.length%2||!/^[\da-f]*$/i.test(hex))throw Error('Invalid original display data');return Uint8Array.from(hex.match(/../g)??[],byte=>parseInt(byte,16));};
 return {segment:source.segment,data:bytes(source.data),displayData:source.displayData.map(block=>({offset:block.offset,data:bytes(block.data)}))};
}
/** Digital monitor scanout for the modes selected by original driver startup.
 * CGA startup selects palette 1 then background 0, clearing intensity bit 4
 * (BIOS semantics also documented by SeaBIOS stdvga_set_cga_background_color).
 * Mode 0Dh uses the 200-line RGBI compatibility interpretation of EGA registers. */
export function nativeRaceDisplayPalette(mode:NativeBrowserDisplayMode,memory:Uint8Array,d:number):number[]{
 if(mode==='ega')return decodeEgaDisplayPalette(memory.subarray(d+0x5334,d+0x5344),'cga-compatible').flat();
 const rgbi=Array.from({length:16},(_,index)=>egaPaletteRgb((index&7)|(index&8?16:0),'cga-compatible'));
 return (mode==='cga'?[rgbi[0],rgbi[3],rgbi[5],rgbi[7]]:rgbi).flat();
}
/** Internal presentation adapter. Loading the source data and original resource
 * banks does not change the default browser mode or expose SETUP choices. */
export async function loadBrowserNativeInitialDisplayData(mode:NativeBrowserDisplayMode,hercules=false){
 const response=await fetch('/game/native-initial-data.json');if(!response.ok)throw Error('Original display data could not load');
 const packet=await response.json() as {modes:Record<NativeBrowserDisplayMode,InitialData>};
 if(hercules&&mode!=='cga')throw Error('Hercules requires the original CGA driver');
 return {...decodeNativeInitialDisplayData(packet.modes[mode]),...(hercules?{hercules:true}:{})};
}
export async function prepareBrowserNativeDisplayRace(data:NativeDemoData,mode:NativeBrowserDisplayMode,live:Uint8Array,hercules=false){
 const source=await loadBrowserNativeInitialDisplayData(mode,hercules);
 const d=0x2d1a0,v=new DataView(live.buffer,live.byteOffset,live.byteLength),address=v.getUint16(d+0x9356,true)+v.getUint16(d+0x9358,true)*16;
 const display=await prepareNativeDisplayRace(data,mode,source,live,Array.from(live.subarray(address,address+1802)));
 return {owner:display.owner,palette:nativeRaceDisplayPalette(mode,display.owner.memory(),display.owner.d),render(memory:Uint8Array){prepareOriginalRaceViewport(memory,d,0xeefe);return display.renderer.render(memory);}};
}

export async function prepareBrowserNativeManualDisplay(data:NativeDemoData,mode:NativeBrowserDisplayMode,live:()=>Uint8Array,hercules=false){
 const prepared=await prepareNativeManualDisplay(data,mode,await loadBrowserNativeInitialDisplayData(mode,hercules),live);
 return {...prepared,palette:nativeRaceDisplayPalette(mode,prepared.owner.memory(),prepared.owner.d)};
}

export async function prepareBrowserNativeResultsDisplay(data:NativeDemoData,mode:NativeBrowserDisplayMode,hercules=false){
 const resources=await prepareNativeDisplayResultsResources(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog),{owner}=resources;
 return {...resources,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeCarDisplay(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,hercules=false){
 const resources=await prepareNativeDisplayCarResources(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog),{owner}=resources;
 return {...resources,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeOpponentDisplay(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,host:Pick<NativeOpponentHost,'resources'|'descriptions'>,hercules=false){
 const resources=await prepareNativeDisplayOpponent(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog,host),{owner}=resources;
 return {...resources,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeTrackDisplay(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,hercules=false){
 const resources=await prepareNativeDisplayTrackResources(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog),{owner}=resources;
 return {...resources,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeEditorDisplay(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,resources:Parameters<typeof prepareNativeDisplayEditorResources>[3],hercules=false){
 const prepared=await prepareNativeDisplayEditorResources(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog,resources),{owner}=prepared;
 return {...prepared,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeMenuDisplay(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,hercules=false){
 const owner=await createNativeDisplayCommonState(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog);
 return {owner,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}

export async function prepareBrowserNativeMainMenu(data:Pick<NativeDemoData,'catalog'>,mode:NativeBrowserDisplayMode,hercules=false){
 const prepared=await prepareNativeDisplayMainMenu(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog),{owner}=prepared;
 return {...prepared,palette:nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels:()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode)};
}
