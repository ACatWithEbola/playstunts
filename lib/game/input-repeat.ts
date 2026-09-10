import {i16} from '../physics/math.ts';
export type OriginalInputWaitRequest={type:'timer'}|{type:'input';delta:number};
/** Original 1B474..1B4A7. Yielding lets the browser supply source timer/input
 * callbacks without blocking its event loop. The initial timer delta is discarded.
 */
export function* originalInputWait(duration:number):Generator<OriginalInputWaitRequest,number,number>{
 let elapsed=0;
 yield {type:'timer'};
 while(i16(duration)>i16(elapsed)){
  const delta=(yield {type:'timer'})&65535;
  elapsed=(elapsed+delta)&65535;
  const key=(yield {type:'input',delta})&65535;
  if(key)return key;
 }
 return 0;
}
