import type {CockpitPanelLayer} from './cockpit-panel.ts';
export interface CockpitExtension {mask:CockpitPanelLayer;art:CockpitPanelLayer}
/** The supplied dast/dasm pairs use only opaque or unchanged pixels. Alpha
 * reproduces that original AND-then-OR operation for any background color.
 * Reject any future mask that would require indexed framebuffer composition.
 */
export function cockpitExtensionRgba({mask,art}:CockpitExtension,palette:readonly number[]){
 if(mask.width!==art.width||mask.height!==art.height||mask.x!==art.x||mask.y!==art.y||mask.pixels.length!==art.pixels.length)throw Error('Original dashboard extension layers do not align');
 const rgba=new Uint8ClampedArray(art.pixels.length*4);
 for(let i=0;i<art.pixels.length;i++){
  const m=mask.pixels[i],p=art.pixels[i];
  if(m===255&&p===0)continue;
  if(m!==0)throw Error('Dashboard extension requires original palette composition');
  rgba.set([palette[p*3],palette[p*3+1],palette[p*3+2],255],i*4);
 }
 return rgba;
}
