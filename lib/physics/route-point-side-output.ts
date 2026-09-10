/** Original 0xaba9..0xabd4. The table is runtime data at DS:9362. */
export function routePointSideOutput(enabled:boolean,previous:number,objectByte:number,recordByte:number,table:ArrayLike<number>){
 return enabled?table[(objectByte&255)+(recordByte&255)]:previous;
}
