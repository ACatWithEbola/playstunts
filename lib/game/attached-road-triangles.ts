export type Point3=[number,number,number];
export type DepthTriangle={points:Point3[];plane:number[]};
const cross=(a:Point3,b:Point3):Point3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a:Point3,b:Point3):Point3=>a.map((v,i)=>v-b[i]) as Point3;
export function polygonPlane(points:Point3[]):number[]{
 const n=cross(sub(points[1],points[0]),sub(points[2],points[0])),length=Math.hypot(...n);
 if(!length)return [0,0,0,0];
 const sign=(n.find(v=>Math.abs(v)>1e-8)??0)<0?-1:1;
 const normal=n.map(v=>v/length*sign);return [...normal,normal.reduce((sum,v,i)=>sum+v*points[0][i],0)];
}
/** Tessellate an attached triangle over a warped parent quad. New vertices are
 * interpolated on the original marking, not moved onto the road. Only its GPU
 * depth reference follows the corresponding original parent triangle.
 * If the marking extends outside the parent footprint, preserve it unchanged.
 */
export function attachedRoadTriangles(points:Point3[],parent:Point3[],fallback:number[]):DepthTriangle[]{
 const original=[{points,plane:fallback}];
 if(parent.length!==4)return original;
 const planes=[polygonPlane(parent.slice(0,3)),polygonPlane([parent[0],parent[2],parent[3]])];
 if(Math.abs(planes[0].slice(0,3).reduce((s,n,i)=>s+n*parent[3][i],0)-planes[0][3])<1e-6)return original;
 const normal=planes[0].slice(0,3),drop=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs))),axes=[0,1,2].filter(i=>i!==drop);
 const edge=(a:Point3,b:Point3,p:Point3)=>(b[axes[0]]-a[axes[0]])*(p[axes[1]]-a[axes[1]])-(b[axes[1]]-a[axes[1]])*(p[axes[0]]-a[axes[0]]);
 const area=(p:Point3[])=>Math.abs(edge(p[0],p[1],p[2]))/2;
 const result:DepthTriangle[]=[];
 for(const [index,triangle] of [[parent[0],parent[1],parent[2]],[parent[0],parent[2],parent[3]]].entries()){
  const orientation=Math.sign(edge(triangle[0],triangle[1],triangle[2]));if(!orientation)return original;
  let clipped=points;
  for(let e=0;e<3&&clipped.length;e++){
   const a=triangle[e],b=triangle[(e+1)%3],next:Point3[]=[];
   for(let i=0;i<clipped.length;i++){
    const p=clipped[i],q=clipped[(i+1)%clipped.length],dp=edge(a,b,p)*orientation,dq=edge(a,b,q)*orientation;
    if(dp>=0)next.push(p);
    if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);next.push(p.map((v,k)=>v+(q[k]-v)*t) as Point3);}
   }
   clipped=next;
  }
  for(let i=1;i<clipped.length-1;i++){
   const fragment=[clipped[0],clipped[i],clipped[i+1]];if(area(fragment)>1e-9)result.push({points:fragment,plane:planes[index]});
  }
 }
 const expected=area(points),actual=result.reduce((sum,t)=>sum+area(t.points),0);
 return result.length&&Math.abs(actual-expected)<=Math.max(1e-6,expected*1e-8)?result:original;
}
