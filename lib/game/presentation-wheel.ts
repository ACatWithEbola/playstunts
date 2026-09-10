import type {Vector} from '../physics/math.ts';
/** Same six original wheel vertices and face rule, retaining screen fractions. */
export function projectPresentationWheel(vectors:readonly Vector[],center:readonly number[],scale:readonly number[]){
 if(vectors.length!==6||vectors.some(p=>p[2]<12))return [];
 const p=vectors.map(v=>[center[0]+v[0]*scale[0]/v[2],center[1]-v[1]*scale[1]/v[2]]);
 const cross=(p[2][0]-p[1][0])*(p[0][1]-p[1][1])-(p[0][0]-p[1][0])*(p[2][1]-p[1][1]);
 return (cross>0?[0,1,2,3]:[3,4,5,0]).map(i=>p[i]);
}
/** Original 16-vertex contour construction, without 320x200 integer rounding. */
export function presentationWheelContours(points:readonly (readonly number[])[],innerScale:number){
 const ellipse=(p:readonly (readonly number[])[])=>{
  const offsets=Array.from({length:8},()=>[0,0]);
  for(let axis=0;axis<2;axis++){const a=p[1][axis]-p[0][axis],b=p[2][axis]-p[0][axis];
   [a,(a+b/2)*0x393e/16384,(a+b)*0x2d41/16384,(b+a/2)*0x393e/16384,b,(b-a/2)*0x393e/16384,(b-a)*0x2d41/16384,(-a+b/2)*0x393e/16384].forEach((n,i)=>offsets[i][axis]=n);
  }
  return [...offsets.map(p2=>p2.map((n,a)=>p[0][a]+n)),...offsets.map(p2=>p2.map((n,a)=>p[0][a]-n))];
 };
 const inner=[points[0],...points.slice(1,3).map(p=>p.map((n,a)=>points[0][a]+(n-points[0][a])*innerScale/16384))];
 const outer=ellipse(points),shift=points[3].map((n,a)=>n-points[0][a]);
 return [...outer,...ellipse(inner),...outer.map(p=>p.map((n,a)=>n+shift[a]))];
}
