import type {Vector} from '../physics/math.ts';
/** Continuous counterpart of 17B2E..17BF5's positive screen-space cross
 * product. Input uses the renderer's original-coordinate camera space
 * (positive Z forward). It deliberately makes no integer-pixel acceptance
 * decision: the GPU clips the actual high-resolution polygon.
 *
 * This is only the facing predicate, not a replacement for source flags,
 * masks, parent grouping, or the original reference rasterizer.
 */
export function continuousPolygonFacing(points:readonly Vector[]):boolean{
 if(points.length<3)return false;
 const [a,b,c]=points;
 // The homogeneous determinant retains the projected cross-product sign
 // without division or loss of a distant polygon to pixel rounding.
 const ab:Vector=[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
 const cb:Vector=[c[0]-b[0],c[1]-b[1],c[2]-b[2]];
 const normal:Vector=[ab[1]*cb[2]-ab[2]*cb[1],ab[2]*cb[0]-ab[0]*cb[2],ab[0]*cb[1]-ab[1]*cb[0]];
 return normal[0]*b[0]+normal[1]*b[1]+normal[2]*b[2]>0;
}

/** Same polygon edge walk as the original near-plane stage, evaluated without
 * integer rounding. The caller supplies the actual display camera near plane.
 */
export function continuousNearClippedPolygon(points:readonly Vector[],near:number):Vector[]{
 if(!(near>0&&Number.isFinite(near)))throw Error('Positive finite camera near plane required');
 const out:Vector[]=[];
 if(!points.length)return out;
 let previous=points[points.length-1];
 for(const point of points){
  const front=point[2]>=near,previousFront=previous[2]>=near;
  if(front!==previousFront){
   const t=(near-previous[2])/(point[2]-previous[2]);
   const intersection:Vector=[previous[0]+t*(point[0]-previous[0]),previous[1]+t*(point[1]-previous[1]),near];
   // A vertex exactly on the plane is already emitted as an original vertex.
   if(t>0&&t<1)out.push(intersection);
  }
  if(front)out.push([...point] as Vector);
  previous=point;
 }
 return out;
}
