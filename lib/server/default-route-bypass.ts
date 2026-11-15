/** A conservative check for the bundled DEFAULT layout only. Both original
 * routes leave this broad central strip: the western arm extends to column 1,
 * while the eastern arm extends beyond column 14. A car remaining between
 * columns 3 and 12 throughout a finished race cannot have driven either arm.
 * This is positive evidence of a major bypass, not a general route witness. */
export const DEFAULT_TRACK_HASH='4111e30379c39020d10f30eef15b7e46aca87a7716e499cde2e89c7c545388fd';
export function createDefaultRouteBypass(trackHash:string){
 let minimum=Infinity,maximum=-Infinity,samples=0;
 return {
  observe(position:readonly number[]){
   const x=position[0]/64;
   if(Number.isFinite(x)){minimum=Math.min(minimum,x);maximum=Math.max(maximum,x);samples++;}
  },
  result(finished:boolean){return trackHash===DEFAULT_TRACK_HASH&&finished&&samples>0&&minimum>=3*1024&&maximum<=12*1024;},
 };
}
