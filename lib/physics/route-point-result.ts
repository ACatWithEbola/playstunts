/** Original 0xad8f..0xae42: signed midpoint, endpoint copies and final-point flag. */
export function routePointResult(first:number[],second:number[],alternate:number,point:number,count:number){
 const midpoint=first.map((value,axis)=>axis===1&&value===-1?-1:Math.trunc((value+second[axis])/2)||0);
 return {midpoint,first:[...first],second:[...second],alternate,last:((point<<24)>>24)===(count&255)-1?1:0};
}
