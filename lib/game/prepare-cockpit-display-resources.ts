import {initializeNativeCockpitResources,type NativeCockpitResourceHost} from './initialize-cockpit-resources.ts';
import type {OriginalCockpitDisplayDrawingHost} from './cockpit-display-host.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
/** Original14A60 mode0 with native alternative display allocation and drawing.
 * The resource service supplies the selected driver's original instrument banks. */
export async function prepareOriginalCockpitDisplayResources(host:Pick<NativeCockpitResourceHost,'memory'|'writeMemory'|'loadBank'>,d:number,mode:'cga'|'tandy'|'ega',drawing:OriginalCockpitDisplayDrawingHost){
 await initializeNativeCockpitResources({...host,
  selectWindow:(offset,segment)=>drawing.selectWindow({offset,segment}),
  drawBitmap:(offset,segment,x,y)=>drawing.bitmap({offset,segment},{x,y},'packed'),
  restoreWindow:()=>restoreOriginalDisplayWindow(host.memory(),d,mode),
 },d,mode);
}
