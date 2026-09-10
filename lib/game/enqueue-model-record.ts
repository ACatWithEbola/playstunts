import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {enqueueOriginalModelMemory} from './enqueue-model-memory.ts';
/** Copy a prepared original record into the caller's current queue slot. */
export function enqueueOriginalModelRecord(memory:Uint8Array,d:number,record:readonly number[],bias:number,tag:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 if(record.length!==20)throw Error('Original queued model record has 20 bytes');
 const address=layout.address,pointer=new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+address(0xaa44),true);
 for(let i=0;i<20;i++)memory[d+((pointer+i)&65535)]=record[i];
 return enqueueOriginalModelMemory(memory,d,bias,tag,layout);
}
