import {polygonPlane,type Point3,type DepthTriangle} from './attached-road-triangles.ts';
import type {Shape} from './types.ts';

export function roadMarkingSurfaces(shape:Shape,paint:number):Point3[][]{
 return shape.primitives.filter(p=>p.type>=3&&p.type<=10&&[19,23,25,28].includes(p.materials[paint])).flatMap(p=>p.indices.slice(1,-1).map((_,i)=>[p.indices[0],p.indices[i+1],p.indices[i+2]].map(index=>shape.vertices[index] as Point3)));
}

/** Split in the unchanged source XZ footprint, retaining original positions.
 * Each fragment gains the actual road plane beneath it for GPU presentation.
 * Native integer-rounded paint can otherwise remain flat on a banked road. */
export function roadMarkingSurfaceFragments(points:Point3[],surfaces:Point3[][],fallback:DepthTriangle[]):DepthTriangle[]{
 const edge=(a:Point3,b:Point3,p:Point3)=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]);
 const area=(p:Point3[])=>Math.abs(edge(p[0],p[1],p[2]))/2,expected=area(points);
 if(expected<1e-8)return fallback;
 const result:DepthTriangle[]=[];
 for(const surface of surfaces){
  const plane=polygonPlane(surface);if(Math.abs(plane[1])<.05)continue;
  const orientation=Math.sign(edge(surface[0],surface[1],surface[2]));if(!orientation)continue;
  let clipped=points;
  for(let e=0;e<3&&clipped.length;e++){
   const a=surface[e],b=surface[(e+1)%3],next:Point3[]=[];
   for(let i=0;i<clipped.length;i++){
    const p=clipped[i],q=clipped[(i+1)%clipped.length],dp=edge(a,b,p)*orientation,dq=edge(a,b,q)*orientation;
    if(dp>=0)next.push(p);
    if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);next.push(p.map((v,k)=>v+(q[k]-v)*t) as Point3);}
   }
   clipped=next;
  }
  for(let i=1;i<clipped.length-1;i++){
   const fragment=[clipped[0],clipped[i],clipped[i+1]];if(area(fragment)<1e-9)continue;
   // Avoid an unrelated lower/upper road crossing in a composite stunt tile.
   const centre=fragment.reduce((sum,p)=>sum.map((v,k)=>v+p[k]/3) as Point3,[0,0,0] as Point3);
   const roadY=(plane[3]-plane[0]*centre[0]-plane[2]*centre[2])/plane[1];
   if(Math.abs(roadY-centre[1])>16)continue;
   result.push({points:fragment,plane});
  }
 }
 const covered=result.reduce((sum,fragment)=>sum+area(fragment.points),0);
 return result.length&&Math.abs(covered-expected)<Math.max(1e-6,expected*1e-6)?result:fallback;
}
