import {createNativeDisplayCommonState,type NativeInitialDisplayData} from './native-display-common-state.ts';
import {loadNativeResource} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {drawOriginalMainMenuDisplaySelection,originalMainMenuDisplayColours} from './main-menu-display.ts';
/** Original 3718..3792 SDMSEL/scrn load and selected-driver menu drawing. */
export async function prepareNativeDisplayMainMenu(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,catalog:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>}){
 const owner=await createNativeDisplayCommonState(mode,source,catalog),d=owner.d,name=(at:number)=>{let value='';for(let i=0;i<65536;i++){const b=owner.memory()[d+((at+i)&65535)];if(!b)return value;value+=String.fromCharCode(b);}throw Error('Unterminated original menu resource');};
 const files={memory:owner.memory,writeMemory:owner.writeMemory,async exists(at:number){return catalog.exists(name(at));},async readFile(at:number){return catalog.read(name(at));},async retry(){throw Error('Original main menu artwork is unavailable');}};
 const bank=await loadNativeResource(files,d,2,0x21d,0xee52,mode);if(!bank)throw Error('Original main menu resource loading was cancelled');
 const screen=findOriginalResource(owner.memory(),d,bank.offset,bank.segment,0x224,true)!;
 return {owner,redraw(){restoreOriginalDisplayWindow(owner.memory(),d,mode);owner.drawing.unclippedBitmap(screen);},outline(selected:number,colour:number){restoreOriginalDisplayWindow(owner.memory(),d,mode);const colours=originalMainMenuDisplayColours(owner.memory(),d);drawOriginalMainMenuDisplaySelection(owner.drawing,selected,colour===14?colours.early:colours.late);}};
}
