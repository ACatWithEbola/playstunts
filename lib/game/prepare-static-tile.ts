import {originalBoundaryModelSubmissions} from './boundary-model-submissions.ts';
import {originalTerrainModelSubmissions} from './terrain-model-submissions.ts';
import {prepareOriginalRoadTile} from './prepare-road-tile.ts';
import type {RoadModelSubmission} from './road-model-submissions.ts';
/** Static portion of original DC68..D1B1, before dynamic objects and cars. */
export function prepareOriginalStaticTile(memory:Uint8Array,d:number,tile:number,terrain:number,column:number,row:number,detail:number,paint:number,camera:readonly number[]):RoadModelSubmission[]{
 const boundary=originalBoundaryModelSubmissions(memory,d,tile,column,row,detail,camera);
 const ground=originalTerrainModelSubmissions(memory,d,terrain,tile,column,row,camera);
 const submissions:RoadModelSubmission[]=[...boundary,...ground.records].map(record=>({mode:'direct',record,depthBias:0}));
 if(tile)submissions.push(...prepareOriginalRoadTile(memory,d,tile,detail,paint,column,row,ground.height,camera));
 return submissions;
}
