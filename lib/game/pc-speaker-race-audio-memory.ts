import type {OriginalPcSpeakerRaceState} from './pc-speaker-race-audio.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export type OriginalPcSpeakerMemoryState=OriginalPcSpeakerRaceState&{driverSegment:number;physicsEngine?:PhysicsEngineVersion};
function layout(engine?:PhysicsEngineVersion){return engine==='ms-1991'?{voices:7,driverBytes:0x2e9}:{voices:5,driverBytes:0x2df};}
function view(memory:Uint8Array,d:number,driverSegment:number,engine?:PhysicsEngineVersion){
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)throw Error('Original data segment is outside memory');
 if(!Number.isInteger(driverSegment)||driverSegment<0||driverSegment>65535||driverSegment*16+layout(engine).driverBytes>memory.length)throw Error('Original PC15 driver is outside memory');
 return new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
}
/** Read the allocated car records and shared PC15 tables in place.
 * The caller supplies the loaded driver segment; no captured startup state is copied. */
export function readOriginalPcSpeakerRaceState(memory:Uint8Array,d:number,driverSegment:number,physicsEngine?:PhysicsEngineVersion):OriginalPcSpeakerMemoryState{
 const format=layout(physicsEngine),v=view(memory,d,driverSegment,physicsEngine),word=(at:number)=>v.getUint16(d+at,true);
 const records=(at:number,count:number,size:number)=>Array.from({length:count},(_,i)=>memory.slice(d+at+i*size,d+at+(i+1)*size));
 const soundFlags:number[]=[];soundFlags[word(0x8016)]=memory[d+0x73d8];
 if(memory[d+0x8fc8])soundFlags[word(0x86de)]=memory[d+0x73dc];
 return {cars:records(0x618e,25,76),timers:records(0x801e,24,72),voices:records(0xa036,format.voices,46),command:memory.slice(d+0x70c4,d+0x70ce),lastNotes:memory.slice(d+0x90e0,d+0x90f8),markers:memory.slice(d+0x931a,d+0x9332),busy:Array.from(memory.slice(d+0xa3aa,d+0xa3c2)),driver:memory.slice(driverSegment*16,driverSegment*16+format.driverBytes),carCounter:word(0x3340),driverSegment,soundFlags,...(physicsEngine?{physicsEngine}:{})};
}
/** Commit only audio-owned state. Queue, input clock, handles, flags and banks
 * remain owned by the game, including when a simulation frame replaces memory. */
export function writeOriginalPcSpeakerRaceState(memory:Uint8Array,d:number,state:OriginalPcSpeakerMemoryState){
 const format=layout(state.physicsEngine),v=view(memory,d,state.driverSegment,state.physicsEngine);
 const tables:[[Uint8Array[],number,number,number],[Uint8Array[],number,number,number],[Uint8Array[],number,number,number]]=[[state.cars,0x618e,25,76],[state.timers,0x801e,24,72],[state.voices,0xa036,format.voices,46]];
 for(const [rows,,count,size] of tables)if(rows.length!==count||rows.some(row=>row.length!==size))throw Error('Incomplete original audio table');
 for(const [bytes,size] of [[state.command,10],[state.lastNotes,24],[state.markers,24],[state.busy,24],[state.driver,format.driverBytes]] as const)if(bytes.length!==size)throw Error('Incomplete original audio state');
 for(const [rows,at,,size] of tables)for(let i=0;i<rows.length;i++)memory.set(rows[i],d+at+i*size);
 for(const [bytes,at] of [[state.command,0x70c4],[state.lastNotes,0x90e0],[state.markers,0x931a],[state.busy,0xa3aa]] as const)memory.set(bytes,d+at);
 memory.set(state.driver,state.driverSegment*16);v.setUint16(d+0x3340,state.carCounter&65535,true);
}
