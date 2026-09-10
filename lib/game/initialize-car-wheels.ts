import {i16,type Vector} from '../physics/math.ts';
/** Supplied FEC3..FFA6. Center Y words are retained by the original caller. */
export function initializeOriginalCarWheels(vertices:readonly Vector[],retainedCenters:readonly Vector[]){
 if(vertices.length!==24||retainedCenters.length!==2)throw Error('Invalid original wheel initialization');
 const half=(n:number)=>{n=i16(n);return i16(i16(n-(n<0?-1:0))>>1);};
 const centers:Vector[]=[[half(vertices[3][0]+vertices[0][0]),retainedCenters[0][1],vertices[0][2]],[half(vertices[6][0]+vertices[9][0]),retainedCenters[1][1],vertices[6][2]]];
 const base=vertices.map((v,i)=>i<12?[i16(centers[i<6?0:1][0]-v[0]),v[1],i16(centers[i<6?0:1][2]-v[2])] as Vector:[...v] as Vector);
 return {base,centers,cache:[0,0,0,0,0]};
}
