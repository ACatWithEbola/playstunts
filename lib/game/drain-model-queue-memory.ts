import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {sortOriginalModelQueue} from './model-queue-order.ts';
import {drainOriginalSortedModelQueue} from './drain-model-queue.ts';
/** Supplied DB72..DC33, including sorted memory arrays and live car palette. */
export function drainOriginalModelQueueMemory(memory:Uint8Array,d:number,before:{player:number;opponent:number},draw:(record:number[],index:number,palette:number)=>number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const address=layout.address,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),count=Math.max(0,memory[d+address(0xa38e)]<<24>>24);
 const depths=Array.from({length:count},(_,i)=>v.getInt16(d+address(0x9aee)+i*2,true)),indices=Array.from({length:count},(_,i)=>v.getUint16(d+address(0xa42c)+i*2,true));
 const sorted=sortOriginalModelQueue(depths,indices);
 sorted.depths.forEach((n,i)=>v.setInt16(d+address(0x9aee)+i*2,n,true));sorted.indices.forEach((n,i)=>v.setUint16(d+address(0xa42c)+i*2,n,true));
 const tags=Array.from(memory.subarray(d+address(0xa012),d+address(0xa012)+count));
 return drainOriginalSortedModelQueue(sorted,tags,[memory[d+address(0x8cdc)],memory[d+address(0x8d94)]],[memory[d+address(0x8ce9)],memory[d+address(0x8da1)]],{...before,palette:memory[d+address(0x9b28)]},(index,palette)=>{
  memory[d+address(0x9b28)]=palette;
  return draw(Array.from({length:20},(_,i)=>memory[d+((address(0x70ea)+index*20+i)&65535)]),index,palette);
 });
}
