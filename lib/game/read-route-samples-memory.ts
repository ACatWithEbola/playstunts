/** Read the caller-owned route samples after original track preparation.
 * Far offsets wrap within their segment, just as in the supplied executable. */
export function readOriginalRouteSamples(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const word=(at:number)=>memory[d+(at&65535)]|(memory[d+((at+1)&65535)]<<8);
 const read=(field:number,index:number)=>{
  const offset=word(field+high),base=word(field+high+2)*16;
  const low=base+((offset+index)&65535),upper=base+((offset+index+1)&65535);
  if(low>=memory.length||upper>=memory.length)throw Error('Original route samples are outside memory');
  return (memory[low]|memory[upper]<<8)<<16>>16;
 };
 const count=memory[d+0xa77e+high];
 return {positions:Array.from({length:count},(_,i)=>[read(0x8ff6,i*6),read(0x8ff6,i*6+2),read(0x8ff6,i*6+4)]),heights:Array.from({length:count},(_,i)=>read(0x9ac6,i*2)),flags:Array.from({length:count},(_,i)=>read(0x9ae4,i*2))};
}
