import {routePointSideOutput} from './route-point-side-output.ts';
import {calculateRoutePoint} from './route-point.ts';
import type {PhysicsEngineVersion} from './engine-version.ts';
export function lookupRoutePoint(tile:number,packed:number,point:number,column:number,row:number,terrain:number,records:{records:number[][]}[],vectors:{records:{primary:number[][]|null;alternate:number[][]|null}[]}[],objects:{multiTile:number}[],physicsEngine?:PhysicsEngineVersion){
 const index=packed&15,record=records[tile].records[index],data=vectors[tile].records[index];
 if(!data.primary)throw Error('Route record has no primary coordinate data');
 return calculateRoutePoint({primary:data.primary,alternate:data.alternate,point,count:record[5],reverse:packed&16,rotation:record[6]+256*record[7],terrain,column,row,multiTile:objects[tile].multiTile},physicsEngine);
}

/** Optional output may read beyond the 16-byte resource into adjacent DOS data. */
export function lookupRoutePointWithSide(tile:number,packed:number,point:number,column:number,row:number,terrain:number,records:{records:number[][]}[],vectors:{records:{primary:number[][]|null;alternate:number[][]|null}[]}[],objects:{multiTile:number}[],objectByte:number,table:ArrayLike<number>,physicsEngine?:PhysicsEngineVersion){
 const record=records[tile].records[packed&15];
 const index=(objectByte&255)+record[13];
 if(index>=table.length)throw Error('Route side lookup requires the original adjacent data bytes');
 return {...lookupRoutePoint(tile,packed,point,column,row,terrain,records,vectors,objects,physicsEngine),side:routePointSideOutput(true,0,objectByte,record[13],table)};
}
