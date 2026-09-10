import type {LoadedEffectResource} from './effect-runtime.ts';
/** Follow resolved 19066 car descriptors in the game's current allocations.
 * No resource relocation or allocation occurs here. */
export function readOriginalCarSoundResources(memory:Uint8Array,d:number,handles:readonly number[]):LoadedEffectResource[]{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const bytes=(at:number,length:number)=>{
  if(!Number.isInteger(at)||!Number.isInteger(length)||at<0||length<0||at+length>memory.length)throw Error('Original car sound resource is outside memory');
  return memory.slice(at,at+length);
 };
 const pointer=(at:number)=>{bytes(at,4);const offset=v.getUint16(at,true),segment=v.getUint16(at+2,true);return {offset,segment,address:segment*16+offset};};
 const resources:LoadedEffectResource[]=[],seen=new Set<string>(),sequences=new Map<number,Uint8Array>();
 for(const handle of handles){
  if(!Number.isInteger(handle)||handle<0||handle>=25)throw Error('Invalid original car audio handle');
  const car=d+0x618e+handle*76;bytes(car,76);
  if(!memory[car]||memory[car+34]!==1)throw Error('Original car sounds have not been allocated and resolved');
  const engine=pointer(car+36),engineKey=`engine:${engine.segment}:${engine.offset}`;
  if(!seen.has(engineKey)){
   if(!engine.address)throw Error('Missing original engine instrument');
   resources.push({headerOffset:0,headerSegment:0,header:new Uint8Array(),instrumentOffset:engine.offset,instrumentSegment:engine.segment,instrument:bytes(engine.address,100),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array()});seen.add(engineKey);
  }
  for(const field of [44,48,52,56,60,64,68,72]){
   const effect=pointer(car+field);if(!effect.address)continue;
   const key=`effect:${effect.segment}:${effect.offset}`;if(seen.has(key))continue;
   const header=bytes(effect.address,17);
   if(header[5]!==1||header[6]!==1||header[11]!==1)throw Error('Original car effect requires a resolved single instrument and sequence');
   const instrument=pointer(effect.address+7),sequence=pointer(effect.address+12);
   // The original scheduler follows a far pointer; it does not validate the
   // dword preceding the commands as a file length. Cached resolved pointers
   // can retain their old target after another replay changes allocations.
   // Keep that target and the complete segment, including retained bytes.
   let commands=sequences.get(sequence.segment);
   if(!commands){commands=bytes(sequence.segment*16,65536);sequences.set(sequence.segment,commands);}
   resources.push({headerOffset:effect.offset,headerSegment:effect.segment,header,instrumentOffset:instrument.offset,instrumentSegment:instrument.segment,instrument:instrument.address?bytes(instrument.address,100):new Uint8Array(),sequenceOffset:0,sequenceSegment:sequence.segment,sequence:commands});seen.add(key);
  }
 }
 return resources;
}
