import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** MS1991 MT15:0195 uses PIT channel2 as a countdown, retaining only bit0
 * changes to port61. Readiness/count delivery is explicit host work. */
export function* delayMs91Mt32Pit(ticks:number):OriginalMt32MpuProgram{
 const threshold=(65535-(ticks&65535))&65535;
 yield {kind:'write',port:0x43,value:0xb6};
 yield {kind:'write',port:0x42,value:255};yield {kind:'write',port:0x42,value:255};
 yield {kind:'write',port:0x61,value:((yield {kind:'read',port:0x61})|1)&255};
 for(;;){
  yield {kind:'write',port:0x43,value:0x80};
  const low=(yield {kind:'read',port:0x42})&255,high=(yield {kind:'read',port:0x42})&255;
  if((low|(high<<8))<threshold)break;
 }
 yield {kind:'write',port:0x61,value:((yield {kind:'read',port:0x61})&254)};
 return 0;
}
