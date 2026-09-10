import {carsOverlap,type CollisionBody} from './car-overlap.ts';
import {trackCollisionPoints} from './track-collision-points.ts';
import {i16} from './math.ts';
import type {TrackObject} from './track.ts';
/** Original 8c5c..8d30. A hit returns before committing the proposed car pose. */
export function landmarkContact(body:CollisionBody,raw:readonly number[],objects:readonly TrackObject[],hillHeight:number,wheelAngle:number){
 const column=i16(body.position[0])>>10,row=29-(i16(body.position[2])>>10);
 let misses=0;
 if(column>=0&&column<30&&row>=0&&row<30){
  for(const point of trackCollisionPoints(raw,objects,column,row,hillHeight)){
   if(carsOverlap(body,{position:point,angles:[0,0,0],dimensions:[1,10,1],radius:10}))return {hit:true,misses,wheelAngle:i16(wheelAngle-512)};
   misses++;
  }
 }
 return {hit:false,misses,wheelAngle};
}
