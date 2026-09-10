import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {rotateZXY} from '../physics/rotation.ts';
import type {Vector} from '../physics/math.ts';
import {originalCarRenderVisibility} from './car-render-visibility.ts';
import {originalCarFramePlacement} from './car-frame-placement.ts';
/** Supplied C744..CA89: both car placements and initial depth biases. */
export function originalCarFrameState(memory:Uint8Array,d:number,lookahead:readonly (readonly number[])[],skip:readonly number[],cameraTile:readonly number[],retainedRows:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),address=layout.address,word=(p:number)=>v.getInt16(d+address(p),true);
 const visible=originalCarRenderVisibility(memory[d+0x12f],memory[d+address(0xa9f0)],memory[d+address(0x8ce9)],memory[d+address(0x8da1)],memory[d+address(0x8fc8)]);
 const view=Array.from({length:9},(_,i)=>word(0xaa5c+i*2));
 const car=(opponent:boolean)=>{
  const row=retainedRows[opponent?1:0]&255;
  if(!(opponent?visible.opponent:visible.player))return {column:255,row,depthBias:0};
  const offset=opponent?0xb8:0,matrix=rotateZXY(-word(0x8c54+offset),-word(0x8c52+offset),-word(0x8c50+offset));
  const corners=Array.from({length:4},(_,i)=>[0,1,2].map(a=>word((opponent?0x9d24:0xa53c)+i*6+a*2)) as Vector);
  const world=[0,1,2].map(a=>v.getInt32(d+address(0x8c38+offset)+a*4,true)) as Vector;
  const surfaces=Array.from(memory.subarray(d+address(0x8ce2+offset),d+address(0x8ce2+offset)+4));
  const placement=originalCarFramePlacement(corners,matrix,world,lookahead,skip,cameraTile,row,surfaces,view,0);
  return {column:placement.column,row:placement.row,depthBias:placement.depthBias};
 };
 return {player:car(false),opponent:car(true)};
}
