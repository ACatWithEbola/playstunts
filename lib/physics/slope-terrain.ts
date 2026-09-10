import {i16,intSin,intCos} from './math.ts';
/** Original terrain finalization 0x11e30..0x11fd4. */
export function slopeTerrain(terrain:number,x:number,z:number,planeGroup=0,height=0){
 if(!Number.isInteger(terrain)||terrain<7||terrain>18)throw Error('Expected original slope terrain 7..18');
 const orientation=(terrain-7)%4;
 const rotation=[0,768,512,256][orientation];
 if(orientation===1)[x,z]=[z,i16(-x)];
 else if(orientation===2)[x,z]=[i16(-x),i16(-z)];
 else if(orientation===3)[x,z]=[i16(-z),x];
 const rounded=(a:number,b:number)=>i16((i16(a)*i16(b)+8192)>>14);
 const diagonal=i16(rounded(intSin(-128),z)+rounded(intCos(-128),x));
 if(terrain<=10){if(planeGroup===0)planeGroup=3;}
 else if(terrain<=14){if(diagonal<0)planeGroup=4;}
 else if(diagonal>0)planeGroup=5;
 else height=450;
 return {planeGroup,height,rotation};
}
