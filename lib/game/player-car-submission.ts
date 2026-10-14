import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied D5D4..D6D8. Full-detail submission requires the original wheel
 * update; callers cannot silently omit it. Geometry remains caller-owned.
 */
export function originalPlayerCarSubmission(memory:Uint8Array,d:number,camera:readonly number[],detail:number,bias:number,tileMask:number,updateWheels:(args:number[])=>void,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 return carSubmission(memory,d,camera,detail,bias,tileMask,updateWheels,false,layout);
}
export function originalOpponentCarSubmission(memory:Uint8Array,d:number,camera:readonly number[],detail:number,bias:number,tileMask:number,updateWheels:(args:number[])=>void,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 return carSubmission(memory,d,camera,detail,bias,tileMask,updateWheels,true,layout);
}
function carSubmission(memory:Uint8Array,d:number,camera:readonly number[],detail:number,bias:number,tileMask:number,updateWheels:(args:number[])=>void,opponent:boolean,layout:OriginalTrackDisplayLayout){
 const offset=opponent?0xb8:0;
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>v.getUint16(d+layout.address(p),true);
 const low=(detail&255)!==0||memory[d+0x134]>2;
 if(!low)updateWheels([(word(opponent?0x7f5a:0x7f44)+48)&65535,word(opponent?0x7f5c:0x7f46),word(0x8c58+offset),layout.address(0x8c8c+offset),layout.address(opponent?0x8adc:0x8a3a),layout.address(opponent?0x8f16:0x8a4c),layout.address(opponent?0x73b4:0x736a)]);
 const record=new Uint8Array(20),out=new DataView(record.buffer);
 const position=[0,1,2].map(axis=>(v.getInt32(d+layout.address(0x8c38+offset)+axis*4,true)>>6)-camera[axis]);
 [...position,word((opponent?0x2042:0x2034)+(low?6:4)),layout.address(opponent?0x903a:0x9032),-word(0x8c54+offset),-word(0x8c52+offset),-word(0x8c50+offset),300].forEach((n,i)=>out.setUint16(i*2,n,true));
 // Original MS91 active slow-video branches use0c for both car descriptors.
 // Region indices3/4 remain in the caller's display-mapped working bank.
 record[18]=layout.ms91SlowVideoManagement?12:4;record[19]=memory[d+layout.address(opponent?0x8fcd:0x8fc6)];
 // MS91 fast-video mode still tracks a status1 car into a local empty
 // rectangle, rather than the retained repaint bank. The caller owns scratch.
 if(layout.ms91SlowVideoManagement===false&&memory[d+layout.address(opponent?0x8da1:0x8ce9)]===1){
  const scratch=layout.ms91CarRegionScratch?.[opponent?'opponent':'player'];
  if(scratch===undefined)throw Error('MS91 visible-car region requires caller-owned scratch');
  if(!Number.isInteger(scratch)||scratch<0||scratch>65528)throw Error('MS91 car-region scratch is outside near memory');
  memory.set(memory.slice(d+0x3312,d+0x331a),d+scratch);
  out.setUint16(8,scratch,true);record[18]=12;
 }
 return {mode:'queued' as const,record:Array.from(record),depthBias:((bias&tileMask)<<16)>>16,tag:opponent?3:2};
}
