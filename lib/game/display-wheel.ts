import {originalWheelDrawPlan} from './wheel-draw-plan.ts';
import {drawOriginalDisplaySolidPolygon} from './display-solid-polygon.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Original wheel contours and face order, using the optimized edge routine. */
export function* drawOriginalDisplayWheel(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',points:readonly (readonly number[])[],innerScale:number,colours:readonly number[],scratch:{leftOffset:number;rightOffset:number}):Generator<OriginalEgaBitmapOperation,void,number>{
 for(const face of originalWheelDrawPlan(points,innerScale,colours))yield* drawOriginalDisplaySolidPolygon(memory,d,mode,face.points,face.color,scratch,undefined,undefined,false);
}
