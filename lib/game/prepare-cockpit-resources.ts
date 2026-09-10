import {initializeNativeCockpitResources,type NativeCockpitResourceHost} from './initialize-cockpit-resources.ts';
import {selectOriginalSpriteWindow,restoreOriginalVideoWindow} from './select-sprite-window.ts';
import {drawOriginalPackedBitmap} from './draw-packed-bitmap.ts';
/** Native cockpit startup including actual window selection and packed drawing.
 * The resource service supplies original loaded banks (kind3 is packed PVS). */
export async function prepareNativeCockpitResources(host:Pick<NativeCockpitResourceHost,'memory'|'writeMemory'|'loadBank'>,d:number){
 await initializeNativeCockpitResources({...host,
  selectWindow:(offset,segment)=>selectOriginalSpriteWindow(host.memory(),offset,segment),
  drawBitmap:(offset,segment,x,y)=>drawOriginalPackedBitmap(host.memory(),offset,segment,x,y),
  restoreWindow:()=>restoreOriginalVideoWindow(host.memory()),
 },d);
}
