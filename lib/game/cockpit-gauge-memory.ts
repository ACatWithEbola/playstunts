/** Keep original gauge lookup bytes outside React props. React's development
 * profiler expands changed typed arrays into per-byte User Timing diagnostics.
 */
export function createCockpitGaugeMemory(){
 let bytes:Uint8Array|undefined,revision=0;
 const readGaugeData=()=>bytes;
 return {
  capture(memory?:Uint8Array){
   if(memory&&memory.length<0x3d1a0)throw Error('Missing original cockpit data segment');
   bytes=memory?.slice(0x2d1a0,0x3d1a0);
   return {readGaugeData,gaugeRevision:++revision};
  },
 };
}
