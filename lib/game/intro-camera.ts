import {i16,intAtan2,intHypot,type Vector} from '../physics/math.ts';
export interface OriginalIntroCamera {tick:number;camera:Vector;target:Vector;logo:number;remainder:number}
export function initialOriginalIntroCamera():OriginalIntroCamera{return {tick:0,camera:[1024,300,1024],target:[0,0,0],logo:0,remainder:0};}
/** Supplied F6DF..F894. advanceCar is the original opponent simulation tick.
 * Car positions are Q6; presentation and simulation retain separate clocks.
 */
export function advanceOriginalIntroCamera(before:OriginalIntroCamera,delta:number,advanceCar:()=>void,readCar:()=>{position:Vector;heading:number}){
 const state:OriginalIntroCamera={...before,camera:[...before.camera],target:[...before.target],remainder:i16(before.remainder+delta)};
 while(state.remainder>5){
  state.remainder=i16(state.remainder-5);advanceCar();state.tick=i16(state.tick+1);
  if(state.tick>220){
   state.logo=1;state.camera[1]=i16(state.camera[1]+20);state.camera[2]=i16(state.camera[2]-5);
   const difference=i16(state.camera[0]-1024),absolute=difference<0?i16(-difference):difference;
   if(absolute<10)state.camera[0]=1024;
   else if(difference>0)state.camera[0]=i16(state.camera[0]-10);
   else if(difference<0)state.camera[0]=i16(state.camera[0]+10);
   for(const axis of [0,2] as const){if(state.target[axis]>1024)state.target[axis]=i16(state.target[axis]-1);else if(state.target[axis]<1024)state.target[axis]=i16(state.target[axis]+1);}
  }
 }
 const car=readCar(),position=car.position.map(value=>i16(value>>6)) as Vector;
 let heading=-1,pitch=0,showCar=1;
 if(state.tick<120){showCar=0;heading=car.heading&1023;state.camera=[position[0],i16(position[1]+20),position[2]];}
 else if(state.tick<220){state.camera=[1024,90,1024];state.target=position;}
 if(heading===-1){const x=i16(state.target[0]-state.camera[0]),z=i16(state.target[2]-state.camera[2]);heading=(-intAtan2(x,z))&1023;pitch=intAtan2(i16(state.target[1]-state.camera[1]),intHypot(x,z))&1023;}
 return {state,draw:[...state.camera,heading,pitch,showCar,state.logo],finished:state.tick>=460};
}
