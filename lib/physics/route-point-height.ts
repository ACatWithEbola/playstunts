import {i16} from './math.ts';
/** Original 0xaccb..0xacf5. Only terrain 6 raises ordinary route heights. */
export function routePointHeight(first:number[],second:number[],terrain:number){
 const a=[...first],b=[...second];
 if(a[1]!==-1&&terrain===6){a[1]=i16(a[1]+450);b[1]=i16(b[1]+450);}
 return {first:a,second:b};
}
