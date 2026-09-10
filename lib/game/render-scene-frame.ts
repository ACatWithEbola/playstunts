import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalModelDisplayLayout} from './model-display-layout.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
import {selectOriginalRenderTiles,type RenderTileSlots} from './select-render-tiles.ts';
import {originalCarFrameState} from './car-frame-state.ts';
import {renderOriginalSceneTile} from './render-scene-tile.ts';
/** Supplied C47E through the selected-tile loop ending at CD98. Projection
 * remains the draw callback's responsibility; original ordering is preserved.
 */
export function renderOriginalSceneFrame(memory:Uint8Array,d:number,heading:number,cameraTile:readonly number[],carTile:readonly number[],threshold:number,beforeSlots:RenderTileSlots,paint:number,camera:Vector,particles:readonly Particle[],opponentRetainedRow:number,beforeVisibility:{player:number;opponent:number},draw:(record:number[],index:number|null,palette:number,tileIndex:number)=>number,updateWheels:(args:number[])=>void,layout:OriginalModelDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const a=layout.address;
 const slots=selectOriginalRenderTiles(memory,d,heading,cameraTile,carTile,threshold,beforeSlots,layout);
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),table=v.getUint16(d+0x872+((heading&1023)>>>7)*2,true);
 const lookahead=Array.from({length:23},(_,i)=>Array.from({length:3},(_,a)=>memory[d+((table+i*3+a)&65535)]<<24>>24));
 const cars=originalCarFrameState(memory,d,lookahead,slots.skip,cameraTile,[carTile[1],opponentRetainedRow],layout);
 let state={deferredFlag:0,deferredRecord:Array.from(memory.subarray(d+a(0x70fe),d+a(0x70fe)+20)),playerBias:cars.player.depthBias,opponentBias:cars.opponent.depthBias,tileMask:0};
 let visibility={...beforeVisibility},stopped=false,tiles=0;
 for(let index=0;index<23;index++)if(slots.skip[index]===0){
  const result=renderOriginalSceneTile(memory,d,slots.tile[index],slots.terrain[index],slots.east[index],slots.south[index],slots.detail[index],paint,camera,state,[cars.player.column,cars.player.row],[cars.opponent.column,cars.opponent.row],particles,visibility,(record,queueIndex,palette)=>draw(record,queueIndex,palette,index),updateWheels,layout);
  state=result.state;visibility=result.visibility;tiles++;
  if(result.stopped){stopped=true;break;}
 }
 return {slots,cars,state,visibility,palette:memory[d+a(0x9b28)],stopped,tiles};
}
