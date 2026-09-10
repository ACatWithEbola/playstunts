import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {renderTileWorldOrigin} from './render-tile-coordinates.ts';
import {originalRoadModelSubmissions,type RoadModelSubmission} from './road-model-submissions.ts';
/** Supplied CE88..D1B1, including elevated underlays before road and overlay. */
export function prepareOriginalRoadTileGeometry(memory:Uint8Array,d:number,tile:number,column:number,row:number,height:number,camera:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>view.getInt16(d+(p&65535),true);
 const footprint=memory[d+0x2018+(tile&255)*14+11];
 const position=renderTileWorldOrigin(memory,d,column,row,footprint,layout);position[1]=height;
 for(let axis=0;axis<3;axis++)position[axis]=(position[axis]-camera[axis])<<16>>16;
 const out:RoadModelSubmission[]=[];
 if(height){
  const table=[0x890,0x894,0x89c,0x8a4][footprint],count=[1,2,2,4][footprint];
  if(table===undefined)throw Error('Original road footprint requires retained caller state');
  for(let i=0;i<count;i++){
   const record=new Uint8Array(20),v=new DataView(record.buffer);
   [position[0]+word(table+i*4),position[1],position[2]+word(table+i*4+2),layout.address(0x7820),layout.address(0x902a),0,0,0,0x800].forEach((n,j)=>v.setUint16(j*2,n,true));
   record[18]=5;out.push({mode:'direct',record:Array.from(record),depthBias:0});
  }
 }
 return {position,underlays:out};
}

export function prepareOriginalRoadTile(memory:Uint8Array,d:number,tile:number,detail:number,paint:number,column:number,row:number,height:number,camera:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga):RoadModelSubmission[]{
 const {position,underlays}=prepareOriginalRoadTileGeometry(memory,d,tile,column,row,height,camera,layout);
 return underlays.concat(originalRoadModelSubmissions(memory,d,tile,detail,paint,position,layout));
}
