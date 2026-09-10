import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied D364..D451: intact track sign, before its destruction particles. */
export function originalTrackSignSubmission(memory:Uint8Array,d:number,index:number,camera:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>v.getUint16(d+(p&65535),true);
 const signed=index<<24>>24,far=(p:number,offset:number)=>word(p+2)*16+((word(p)+offset)&65535);
 const kind=memory[far(layout.address(0xa9ec),signed)],descriptor=0x2bb0+kind*14,record=new Uint8Array(20),out=new DataView(record.buffer);
 const position=[0,1,2].map(axis=>v.getInt16(far(layout.address(0x70e0),signed*6+axis*2),true)-camera[axis]);
 [...position,word(descriptor+4),layout.address(0x902a),0,0,v.getUint16(far(layout.address(0xa3c4),signed*2),true),0x64].forEach((n,i)=>out.setUint16(i*2,n,true));
 record[18]=4;
 return {mode:'queued' as const,record:Array.from(record),depthBias:0};
}
