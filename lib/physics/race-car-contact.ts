import {carsOverlap,type CollisionBody} from './car-overlap.ts';
import {carContactResponse} from './car-contact-response.ts';
export interface RaceContactCar {speed:number;roadSpeed:number;wheelAngle:number;contact:number;yaw:number}
/** Original 8b8a..8c55, before small-object contact and proposed-pose commit.
 * Crash requests are returned in the original selected-car then other-car order.
 */
export function raceCarContact(enabled:boolean,selected:0|1,bodies:readonly [CollisionBody,CollisionBody],cars:readonly [RaceContactCar,RaceContactCar]){
 if(!enabled||!carsOverlap(...bodies))return {suppressPose:false,cars,crashCars:[] as (0|1)[]};
 if(cars[0].contact)return {suppressPose:true,cars,crashCars:[] as (0|1)[]};
 const response=carContactResponse(...cars);
 return {suppressPose:true,cars:response.cars.map((car,i)=>({...cars[i],...car})),crashCars:response.crash?[selected,(selected^1) as 0|1]:[]};
}
