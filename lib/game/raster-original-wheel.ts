import {originalWheelDrawPlan} from './wheel-draw-plan.ts';
import {rasterOriginalPolygon} from './raster-original-polygon.ts';
/** Original wheel geometry and optimized polygon draws, 28AB2..28CF3. */
export function rasterOriginalWheel(points:readonly (readonly number[])[],innerScale:number,colors:readonly number[],rectangle:readonly number[],span:(x:number,y:number,count:number,color:number)=>void){
 for(const face of originalWheelDrawPlan(points,innerScale,colors))rasterOriginalPolygon(face.points,rectangle,face.color,span,undefined,undefined,false);
}
