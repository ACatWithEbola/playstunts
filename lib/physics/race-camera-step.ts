import {i16,intAtan2,intHypot,intSin,intCos,type Vector} from './math.ts';
export interface RaceCameraCar {position:Vector;target:Vector;angle:number;routeIndex:number;field9e:number;crash:number}
/** Original shared camera update 0x146d4..0x149c3, per car. */
export function raceCameraStep(before:Vector,car:RaceCameraCar,frame:number,cameras:Vector[],selected:number,playerFlags=false){
 const position=car.position.map(v=>i16(v>>6)) as Vector;
 const angle=i16(car.angle);
 const target=playerFlags||i16(car.field9e)!==0||(car.crash&255)!==0||i16(car.routeIndex)===-1||(angle>128&&angle<896)?position:car.target;
 const result=[...before] as Vector;
 const dy=i16(result[1]-i16(position[1]+270));result[1]=i16(result[1]-Math.max(-30,Math.min(30,dy)));
 const dx=i16(target[0]-result[0]),dz=i16(target[2]-result[2]);
 const heading=intAtan2(dx,dz);
 const distance=intHypot(i16(position[0]-result[0]),i16(position[2]-result[2]));
 if(distance>450){const step=Math.min(distance-450,120);result[0]=i16(result[0]+((Math.imul(step,intSin(heading))+8192)>>14));result[2]=i16(result[2]+((Math.imul(step,intCos(heading))+8192)>>14));}
 if((frame&65535)%10===0){let best=10000;for(let i=0;i<cameras.length;i++){
  const x=cameras[i][0]-position[0],z=cameras[i][2]-position[2];
  if(Math.abs(x)<best&&Math.abs(z)<best){const distance=intHypot(i16(x),i16(z));if(distance<best){best=distance;selected=i;}}
 }}
 return {position:result,previous:[...before] as Vector,selected};
}
