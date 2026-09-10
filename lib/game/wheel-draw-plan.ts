import {originalWheelContours} from './wheel-contours.ts';
/** Supplied 28AB2..28CF3: sixteen tread quads, two sidewall halves and
 * the inner face, with the original point order and three caller colors.
 */
export function originalWheelDrawPlan(points:readonly (readonly number[])[],innerScale:number,colors:readonly number[],contours=originalWheelContours){
 if(colors.length!==3)throw Error('Original wheel draw requires three colors');
 const vertices=contours(points,innerScale);
 const out:{kind:'quad'|'polygon';color:number;points:number[][]}[]=[];
 for(let i=0;i<16;i++){const next=(i+1)&15;out.push({kind:'quad',color:colors[0]&65535,points:[vertices[i],vertices[next],vertices[32+next],vertices[32+i]]});}
 let top=0;for(let i=1;i<16;i++)if(vertices[i][1]<vertices[top][1])top=i;
 for(const direction of [1,-1]){
  const indices=Array.from({length:9},(_,i)=>(top+direction*i)&15);
  out.push({kind:'polygon',color:colors[1]&65535,points:[...indices.map(i=>vertices[i]),...indices.toReversed().map(i=>vertices[16+i])]});
 }
 out.push({kind:'polygon',color:colors[2]&65535,points:vertices.slice(16,32)});
 return out;
}
