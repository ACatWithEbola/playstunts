import type {OriginalTandyRaceState} from './tandy-race-audio.ts';
export type OriginalTandyMemoryState=OriginalTandyRaceState&{driverSegment:number};
function view(memory:Uint8Array,d:number,driverSegment:number){
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)throw Error('Original data segment is outside memory');
 if(!Number.isInteger(driverSegment)||driverSegment<0||driverSegment>65535||driverSegment*16+2993>memory.length)throw Error('Original TD15 driver is outside memory');
 return new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
}
/** Read the allocated car records and shared TD15 tables in place.
 * The caller supplies the loaded driver segment; no captured startup state is copied. */
export function readOriginalTandyRaceState(memory:Uint8Array,d:number,driverSegment:number):OriginalTandyMemoryState{
 const v=view(memory,d,driverSegment),word=(at:number)=>v.getUint16(d+at,true);
 const records=(at:number,count:number,size:number)=>Array.from({length:count},(_,i)=>memory.slice(d+at+i*size,d+at+(i+1)*size));
 const soundFlags:number[]=[];soundFlags[word(0x8016)]=memory[d+0x73d8];
 if(memory[d+0x8fc8])soundFlags[word(0x86de)]=memory[d+0x73dc];
 return {cars:records(0x618e,25,76),timers:records(0x801e,24,72),voices:records(0xa036,6,46),command:memory.slice(d+0x70c4,d+0x70ce),lastNotes:memory.slice(d+0x90e0,d+0x90f8),markers:memory.slice(d+0x931a,d+0x9332),busy:Array.from(memory.slice(d+0xa3aa,d+0xa3c2)),driver:memory.slice(driverSegment*16,driverSegment*16+2993),carCounter:word(0x3340),driverSegment,soundFlags};
}
/** Commit only audio-owned state. Queue, input clock, handles, flags and banks
 * remain owned by the game, including when a simulation frame replaces memory. */
export function writeOriginalTandyRaceState(memory:Uint8Array,d:number,state:OriginalTandyMemoryState){
 const v=view(memory,d,state.driverSegment);
 const tables:[[Uint8Array[],number,number,number],[Uint8Array[],number,number,number],[Uint8Array[],number,number,number]]=[[state.cars,0x618e,25,76],[state.timers,0x801e,24,72],[state.voices,0xa036,6,46]];
 for(const [rows,,count,size] of tables)if(rows.length!==count||rows.some(row=>row.length!==size))throw Error('Incomplete original audio table');
 for(const [bytes,size] of [[state.command,10],[state.lastNotes,24],[state.markers,24],[state.busy,24],[state.driver,2993]] as const)if(bytes.length!==size)throw Error('Incomplete original audio state');
 for(const [rows,at,,size] of tables)for(let i=0;i<rows.length;i++)memory.set(rows[i],d+at+i*size);
 for(const [bytes,at] of [[state.command,0x70c4],[state.lastNotes,0x90e0],[state.markers,0x931a],[state.busy,0xa3aa]] as const)memory.set(bytes,d+at);
 memory.set(state.driver,state.driverSegment*16);v.setUint16(d+0x3340,state.carCounter&65535,true);
}
