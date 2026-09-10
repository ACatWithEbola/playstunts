/** Initial wheel-angle locals inherited by original contact routine 74de.
 * From 9640 entry SP: caller prologue 10, player argument/call 6,
 * player prologue 88, contact arguments/call 14, saved BP 2 = 120.
 * The four retained words begin at contact BP-13e. This reads actual retained
 * stack memory; it does not reconstruct intervening original stack writes.
 */
export function readRaceContactScratch(memory:Uint8Array,stackSegment:number,frameEntrySP:number){
 return readContactFrameScratch(memory,stackSegment,frameEntrySP-120);
}
export function readContactFrameScratch(memory:Uint8Array,stackSegment:number,framePointer:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return [0,1,2,3].map(index=>{
  const address=stackSegment*16+((framePointer-0x13e+index*2)&65535);
  if(address<0||address+2>memory.length)throw Error('Original contact scratch is outside memory');
  return view.getInt16(address,true);
 });
}

/** Retain the words written by 76f1 for a subsequent call or replay seek.
 * The frame caller owns this memory copy; other stack locals remain separate.
 */
export function writeRaceContactScratch(memory:Uint8Array,stackSegment:number,frameEntrySP:number,angles:readonly number[]){
 return writeContactFrameScratch(memory,stackSegment,frameEntrySP-120,angles);
}
export function writeContactFrameScratch(memory:Uint8Array,stackSegment:number,framePointer:number,angles:readonly number[]){
 if(angles.length!==4)throw Error('Original contact scratch requires four words');
 // Validate the whole target before writing any word.
 readContactFrameScratch(memory,stackSegment,framePointer);
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(let index=0;index<4;index++)view.setInt16(stackSegment*16+((framePointer-0x13e+index*2)&65535),angles[index],true);
}

/** Adjacent locals: 755e/7564 stores front angle; 8cce adds six after each
 * non-colliding small-object test. The counter intentionally retains its seed.
 */
export function writeRaceContactNeighbors(memory:Uint8Array,stackSegment:number,frameEntrySP:number,front:number,misses?:number){
 return writeContactFrameNeighbors(memory,stackSegment,frameEntrySP-120,front,misses);
}
export function writeContactFrameNeighbors(memory:Uint8Array,stackSegment:number,framePointer:number,front:number,misses?:number){
 const at=(offset:number)=>stackSegment*16+((framePointer-offset)&65535);
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(const offset of [0x142,0x140])if(at(offset)<0||at(offset)+2>memory.length)throw Error('Original contact neighbor is outside memory');
 view.setInt16(at(0x140),front,true);
 if(misses!==undefined)view.setUint16(at(0x142),(view.getUint16(at(0x142),true)+misses*6)&65535,true);
}

/** 7807..783e copies four unmoved wheel origins into BP-174.
 * The opponent's third origin overlaps the player's retained angle locals.
 */
export function writeContactFrameOrigins(memory:Uint8Array,stackSegment:number,framePointer:number,origins:ReadonlyArray<readonly number[]>){
 if(origins.length!==4||origins.some(origin=>origin.length!==3))throw Error('Original contact requires four wheel origins');
 const addresses=Array.from({length:24},(_,index)=>stackSegment*16+((framePointer-0x174+index*2)&65535));
 if(addresses.some(address=>address<0||address+2>memory.length))throw Error('Original contact origins are outside memory');
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 origins.flat().forEach((value,index)=>{view.setUint16(addresses[index*2],value&65535,true);view.setUint16(addresses[index*2+1],value>>>16,true);});
}
