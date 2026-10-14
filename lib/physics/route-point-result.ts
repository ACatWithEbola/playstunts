import type {PhysicsEngineVersion} from './engine-version.ts';
/** Legacy AD8F divides the signed32 sum toward zero; MS91 B479 uses SAR/RCR. */
export function routePointResult(first:number[],second:number[],alternate:number,point:number,count:number,physicsEngine?:PhysicsEngineVersion){
 const midpoint=first.map((value,axis)=>axis===1&&value===-1?-1:(physicsEngine==='ms-1991'?Math.floor((value+second[axis])/2):Math.trunc((value+second[axis])/2))||0);
 return {midpoint,first:[...first],second:[...second],alternate,last:((point<<24)>>24)===(count&255)-1?1:0};
}
