import {composeCockpitPanel,type CockpitPanelLayer} from './cockpit-panel.ts';
interface AnchoredLayer extends CockpitPanelLayer {anchorX:number;anchorY:number}
export interface CockpitGearAssets {base:CockpitPanelLayer;mask:AnchoredLayer;art:AnchoredLayer}
/** Original 0x256a0 AND and 0x25e94 OR: supplied knob coordinates minus
 * signed shape anchors. The gearbox background is restored for each draw.
 */
export function drawCockpitGear(data:CockpitGearAssets,x:number,y:number){
 const positioned=(layer:AnchoredLayer)=>({...layer,x:(x-layer.anchorX)<<16>>16,y:(y-layer.anchorY)<<16>>16});
 return composeCockpitPanel(new Uint8Array(data.base.pixels),data.base.width,data.base.height,positioned(data.mask),positioned(data.art),true);
}
