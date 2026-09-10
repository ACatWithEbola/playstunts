import {i16,vecTransform,type Vector} from '../physics/math.ts';
/** Supplied 16D7D..16DD3: optional signed halving precedes the original
 * fixed-point matrix transform; translation then wraps each result as a word.
 */
export function transformOriginalModelVertex(vertex:Vector,matrix:number[],translation:Vector,halfSize:number):Vector{
 const local=vertex.map(n=>(halfSize&65535)?Math.trunc(i16(n)/2):i16(n)) as Vector;
 return vecTransform(local,matrix).map((n,a)=>i16(n+translation[a])) as Vector;
}
