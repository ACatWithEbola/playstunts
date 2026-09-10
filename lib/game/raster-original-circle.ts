import {originalCirclePlan} from './original-circle-plan.ts';
import {originalLargeEllipseContour} from './original-large-ellipse-contour.ts';
import {rasterOriginalPolygon} from './raster-original-polygon.ts';
/** Joined original circle path, including table spans and 32-point large ellipses. */
export function rasterOriginalCircle(memory:Uint8Array,d:number,x:number,y:number,diameter:number,color:number,rectangle:readonly number[],span:(x:number,y:number,count:number,color:number)=>void){
 const plan=originalCirclePlan(memory,d,x,y,diameter,color,rectangle);
 if(plan.type==='point'){
  const [px,py]=plan.point;if(px>=rectangle[0]&&px<rectangle[1]&&py>=rectangle[2]&&py<rectangle[3])span(px,py,1,color&255);
 }else if(plan.type==='ellipse')rasterOriginalPolygon(originalLargeEllipseContour(plan.points),rectangle,color,span,undefined,undefined,false);
 else if(plan.type==='spans')for(let i=0;i<plan.left.length;i++){
  const count=((plan.right[i]-plan.left[i]+1)<<16)>>16;if(count>0)span(plan.left[i],plan.start+i,count,color&255);
 }
}
