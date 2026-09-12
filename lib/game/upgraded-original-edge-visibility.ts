import type {Shape} from './types.ts';

export type OriginalEdgeSegment={primitive:number;start:number;end:number};

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
 const result:OriginalEdgeSegment[]=[];
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
  for(const edge of edges.values())if(edge.count===1)result.push({primitive:edge.primitive,start:edge.start,end:edge.end});
 }
 return result;
}
