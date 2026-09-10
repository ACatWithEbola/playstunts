/** Original gettlistpoint index calculation 0xab8f..0xaba9. */
export function routePointIndex(point:number,count:number,reverse:number){
 return (reverse?((count-point)*2-2):point*2)&255;
}
