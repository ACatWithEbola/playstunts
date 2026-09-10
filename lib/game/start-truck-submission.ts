import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {i16,intSin,intCos,type Vector} from '../physics/math.ts';
import {originalCarMatchesSubmissionTile} from './car-tile-submission-gate.ts';
/** Supplied D94C..DB71: the original GAME2.truk start-area model. Its four
 * moving vertices remain in original segmented memory, including retained Y.
 */
export function originalStartTruckSubmission(memory:Uint8Array,d:number,tile:readonly number[],retainedTile:readonly number[],camera:Vector,tileMask:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 if(memory[d+layout.address(0x8eab)]!==0||!originalCarMatchesSubmissionTile([memory[d+layout.address(0x8fba)],memory[d+layout.address(0x8fbc)]],tile,retainedTile))return null;
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>v.getInt16(d+(p&65535),true);
 const angle=word(layout.address(0x93dc)),heading=word(layout.address(0x9b2a)),mul=(a:number,b:number)=>i16((Math.imul(i16(a),i16(b))+8192)>>14);
 const x=mul(intCos(angle),36),z=i16(mul(intSin(angle),36)+56);
 const offset=(v.getUint16(d+layout.address(0x7dfa),true)+48)&65535,segment=v.getUint16(d+layout.address(0x7dfc),true)*16;
 for(let i=0;i<4;i++){
  v.setInt16(segment+((offset+i*6)&65535),i16(i<2?x-36:36-x),true);
  v.setInt16(segment+((offset+i*6+4)&65535),z,true);
 }
 const signedByte=(n:number)=>n<<24>>24;
 const position=[i16(mul(intSin(heading+256),36)+mul(intSin(heading+512),438)+word(layout.address(0xa3e2)+signedByte(memory[d+layout.address(0x8fba)])*2)-camera[0]),
 i16(word(0x122+signedByte(memory[d+layout.address(0x8fbb)])*2)-camera[1]),
 i16(mul(intCos(heading+256),36)+mul(intCos(heading+512),438)+word(layout.address(0xa796)+signedByte(memory[d+layout.address(0x8fbc)])*2)-camera[2])];
 const sign=angle<0?-1:0,paint=Math.min(3,i16(((i16((angle^sign)-sign)>>6)^sign)-sign));
 const record=new Uint8Array(20),out=new DataView(record.buffer);
 [...position,layout.address(0x7df8),layout.address(0x902a),0,0,heading,0x400].forEach((n,i)=>out.setUint16(i*2,n,true));record[18]=4;record[19]=paint;
 return {mode:'queued' as const,record:Array.from(record),depthBias:i16(tileMask&-2048),tag:0};
}
