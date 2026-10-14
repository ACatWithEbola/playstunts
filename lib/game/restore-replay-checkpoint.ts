/** Original 9578..963f. Select/restore a checkpoint; subsequent playback advances to the requested frame. */
import {uses1991Physics,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {raceSnapshotSize,unpackVersionedRaceSnapshot} from './versioned-race-snapshot.ts';
import {writeMs91BodyCaches} from './ms91-body-cache-memory.ts';
export function restoreReplayCheckpoint(before:Uint8Array,dataSegment:number,target:number,initialize:(memory:Uint8Array)=>Uint8Array,framesPerSecond:10|20=20,engine?:PhysicsEngineVersion){
 const modern=uses1991Physics(engine),size=raceSnapshotSize(engine);
 const interval=30*framesPerSecond,limit=12000,slots=limit/interval;
 if(!Number.isInteger(target)||target<0||target>limit)throw Error('Replay target must be within the original recording duration');
 let memory=before.slice();
 if(dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 let v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const at=(offset:number)=>dataSegment+offset;
 if(target===0&&v.getUint16(at(0xa034),true)===0){memory=initialize(memory).slice();v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);}
 let index=Math.trunc(target/interval);if(index===slots)index--;
 const current=v.getUint16(at(0x8c26),true);
 const address=(extra:number)=>{
  const offset=v.getUint16(at(0xa030),true)+index*size+extra;
  const segment=(v.getUint16(at(0xa032),true)+((offset>>>16)<<12))&65535;
  return {offset:offset&65535,segment};
 };
 if(target>=current){
  while(index*interval>current){
   const p=address(modern?0x3f4:0x3c4),a=p.segment*16+p.offset;
   if(a>=memory.length)throw Error('Original checkpoint marker is outside memory');
   if(memory[a]!==0)break;
   index--;
  }
  if(index*interval<=current)return {memory,checkpoint:null};
 }
 const p=address(0);
 // REP MOVSW wraps SI within its source segment, preserving forward-copy order.
 const packed=modern?new Uint8Array(size):undefined,pv=packed?new DataView(packed.buffer):undefined;
 for(let i=0;i<size;i+=2){
  const source=p.segment*16+((p.offset+i)&65535);
  if(source+2>memory.length)throw Error('Original checkpoint is outside memory');
  if(pv)pv.setUint16(i,v.getUint16(source,true),true);
  else v.setUint16(at(0x8ae6+i),v.getUint16(source,true),true);
 }
 if(packed){const restored=unpackVersionedRaceSnapshot(packed,'ms-1991');memory.set(restored.canonical,at(0x8ae6));memory=writeMs91BodyCaches(memory,dataSegment,framesPerSecond,restored.caches!);v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);}
 for(let i=0;i<6;i++)memory[at(0x9f5c+i)]=memory[at(0x8ea4+i)];
 v.setUint16(at(0x73b2),v.getUint16(at(0x8c26),true),true);
 return {memory,checkpoint:index};
}
