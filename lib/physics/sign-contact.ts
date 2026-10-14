import {carsOverlap,type CollisionBody} from './car-overlap.ts';
import {i16,type Vector} from './math.ts';
export interface SignCollisionData {cells:readonly number[];positions:readonly Vector[];broken:readonly number[]}
/** Share an accepted marker with the next car without mutating checkpoint input. */
export function signsAfterImpact(data:SignCollisionData|undefined,impact:ReturnType<typeof signContact>){
 return impact&&data?{...data,broken:data.broken.map((value,index)=>index===impact.index?1:value)}:data;
}
/** Original indexed-sign caller. A sign hit does not reject the car pose. */
export function signContact(body:CollisionBody,data:SignCollisionData,yaw:number,roadSpeed:number){
 const column=i16(body.position[0])>>10,row=i16(body.position[2])>>10;
 if(column<0||column>=30||row<0||row>=30)return undefined;
 const index=data.cells[row*30+column];
 if(index===255)return undefined;
 if(index===undefined||index<0||index>=48||!data.positions[index])throw Error('Invalid original sign collision index');
 if(data.broken[index])return undefined;
 if(!carsOverlap(body,{position:data.positions[index],angles:[0,0,0],dimensions:[5,40,5],radius:10}))return undefined;
 return {index,owner:index+2,yaw:i16(-yaw),speed:Math.trunc((roadSpeed&65535)*1408/15360)};
}
