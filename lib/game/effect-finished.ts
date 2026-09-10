/** Original 0x2953a. Completion depends on the logical sequence pointer,
 * not hardware release tails or the scheduler's remaining delay counter.
 */
export function effectFinished(timers:Uint8Array[],handle:number,enabled:number){
 handle=handle<<16>>16;
 if(enabled===0||handle<16||handle>23)return true;
 const record=timers[handle];
 if(!record||record.length!==72)throw Error('Invalid original effect timer');
 return new DataView(record.buffer,record.byteOffset,record.byteLength).getUint32(0,true)===0;
}
