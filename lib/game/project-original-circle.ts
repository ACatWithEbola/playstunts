import {i16,intHypot3d,type Vector} from '../physics/math.ts';
/** Supplied 177BA..178E5. Preserve the original second bounds-point X
 * overwrite (Y+radius) and retained Y-radius instead of correcting its shape.
 */
export function projectOriginalCircle(vectors:readonly Vector[],point:readonly number[],flags:readonly number[],scaleX:number,beforeRectangle:readonly number[]){
 const depth=i16(vectors[0][2]+vectors[1][2]),rectangle=beforeRectangle.map(i16);
 if(flags[0]+flags[1]!==0)return {depth,rectangle,visible:false,radius:null};
 const distance=intHypot3d(vectors[0].map((v,i)=>i16(v-vectors[1][i])) as Vector)&65535;
 const divisor=vectors[0][2]&65535;
 if(!divisor)throw Error('Original circle projection divides by zero');
 const radiusWord=Math.floor((scaleX&65535)*distance/divisor);
 if(radiusWord>65535)throw Error('Original circle projection overflows division');
 const radius=i16(radiusWord),x=i16(point[0]),y=i16(point[1]);
 for(const [px,py] of [[i16(x-radius),i16(y-radius)],[i16(y+radius),i16(y-radius)]]){
  rectangle[0]=Math.min(rectangle[0],px);rectangle[1]=Math.max(rectangle[1],i16(px+1));rectangle[2]=Math.min(rectangle[2],py);rectangle[3]=Math.max(rectangle[3],i16(py+1));
 }
 return {depth,rectangle,visible:true,radius};
}
