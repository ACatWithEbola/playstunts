import {trackModelOrigin} from './track-model-origin.ts';
/** Original renderer CE88..CF2D and D0C0..D12B: geometry-space placement.
 * Positive original yaw maps to positive Three.js Y rotation before the common
 * world Z reflection. Car body pose rotation follows its separate caller.
 */
export function trackRenderPlacement(descriptor:{rotation:number;multiTile:number;paint:number},column:number,row:number,height:number,animationPaint:number){
 const position=trackModelOrigin(column,row,descriptor.multiTile);position[1]=height;
 return {position,rotation:descriptor.rotation*Math.PI/512,paint:descriptor.paint&128?animationPaint:descriptor.paint};
}
