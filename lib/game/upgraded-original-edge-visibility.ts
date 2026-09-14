import type {Shape} from './types.ts';

export type OriginalEdgeSegment={primitive:number;start:number;end:number};

// These source materials are used for fences, guard walls and the narrow side
// faces of elevated roads and bridges. Their original raster footprint can be
// one pixel even though the face remains geometrically connected to a deck.
const THIN_WALL_MATERIALS=new Set([22,31,32]);

/**
 * The native integer rasterizer keeps a one-pixel trace of a vertical polygon
 * when it turns exactly edge-on. GPU triangles collapse to zero area instead.
 * Identify only connected, zero-thickness vertical components so the upgraded
 * renderer can retain that original one-pixel edge without thickening roads.
 */
export function upgradedOriginalEdgeSegments(shape:Shape):OriginalEdgeSegment[]{
 const surfaces=shape.primitives.map((primitive,index)=>({primitive,index})).filter(({primitive})=>primitive.type>=3&&primitive.type<=10);
 const parent=new Map(surfaces.map(({index})=>[index,index]));
 const find=(index:number):number=>{const value=parent.get(index);if(value===undefined||value===index)return index;const root=find(value);parent.set(index,root);return root;};
 const union=(left:number,right:number)=>{const a=find(left),b=find(right);if(a!==b)parent.set(b,a);};
 const owner=new Map<number,number>();
 for(const {primitive,index} of surfaces)for(const vertex of primitive.indices){const prior=owner.get(vertex);if(prior===undefined)owner.set(vertex,index);else union(index,prior);}
 const components=new Map<number,typeof surfaces>();
 for(const surface of surfaces){const root=find(surface.index),component=components.get(root);if(component)component.push(surface);else components.set(root,[surface]);}
 const result:OriginalEdgeSegment[]=[],seen=new Set<string>();
 const add=(primitive:number,start:number,end:number)=>{
  const key=primitive+'/'+Math.min(start,end)+'/'+Math.max(start,end);
  if(!seen.has(key)){seen.add(key);result.push({primitive,start,end});}
 };
 for(const component of components.values()){
  const indices=[...new Set(component.flatMap(({primitive})=>primitive.indices))];
  const extents=[0,1,2].map(axis=>{const values=indices.map(index=>shape.vertices[index][axis]);return Math.max(...values)-Math.min(...values);});
  // Horizontal planes are already stable in the road view. Only preserve a
  // component that is vertical and exactly flat across X or Z.
  if(extents[1]<=1e-6||!(extents[0]<=1e-6||extents[2]<=1e-6))continue;
  // The windmill rotor is a radial triangle fan whose material mask exposes
  // four blades from a disc. Outlining that component would reveal the hidden
  // sixteen-sided disc as a false circle around the blades.
  const common=component[0].primitive.indices.filter(index=>component.every(({primitive})=>primitive.indices.includes(index)));
  const maskedRadialFan=component.length>=8&&component.every(({primitive})=>primitive.type===3)&&common.length>0;
  if(maskedRadialFan)continue;
  const edges=new Map<string,{primitive:number;start:number;end:number;count:number}>();
  for(const {primitive,index} of component)for(let at=0;at<primitive.indices.length;at++){
   const start=primitive.indices[at],end=primitive.indices[(at+1)%primitive.indices.length];
   const key=start<end?`${start}/${end}`:`${end}/${start}`,prior=edges.get(key);
   if(prior)prior.count++;else edges.set(key,{primitive:index,start,end,count:1});
  }
  for(const edge of edges.values())if(edge.count===1)add(edge.primitive,edge.start,edge.end);
 }
 // A thin wall can share vertices with a much larger road component, so the
 // component test above correctly declines to outline it. Preserve only the
 // source materials dedicated to walls/rails, and only when the individual
 // face is a long, slender vertical sheet. This covers every native one-pixel
 // wall without outlining ordinary buildings or broad road faces.
 for(const {primitive,index} of surfaces){
  if(!primitive.materials.every(material=>THIN_WALL_MATERIALS.has(material)))continue;
  const points=primitive.indices.map(vertex=>shape.vertices[vertex]);
  const vertical=Math.max(...points.map(point=>point[1]))-Math.min(...points.map(point=>point[1]));
  if(vertical<=1e-6)continue;
  const a=points[1].map((value,axis)=>value-points[0][axis]),b=points[2].map((value,axis)=>value-points[0][axis]);
  const normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalLength=Math.hypot(...normal);
  if(normalLength<=1e-6||Math.abs(normal[1])/normalLength>.1)continue;
  const lengths=points.map((point,at)=>{
   const next=points[(at+1)%points.length];
   return Math.hypot(next[0]-point[0],next[1]-point[1],next[2]-point[2]);
  }).filter(length=>length>1e-6);
  if(lengths.length<3||Math.min(...lengths)/Math.max(...lengths)>.1)continue;
  for(let at=0;at<primitive.indices.length;at++)add(index,primitive.indices[at],primitive.indices[(at+1)%primitive.indices.length]);
 }
 return result;
}
