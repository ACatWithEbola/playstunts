import {i16,intSin,intCos,type Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Original pipe-entrance branch 29 at 0x113f0-0x11518. */
export function pipeEntrySelection(point:Vector,previous:Vector,roadSurface:number):ElevatedSelection{
 const [x,y,z]=point,[oldX]=previous;
 const out:ElevatedSelection={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(Math.abs(oldX)>=115&&Math.abs(x)<=164){out.wallUpper=151;out.wall=oldX>0?159:160;return out;}
 if(Math.abs(x)>=115||y>=171)return out;
 out.surface=roadSurface;
 if(Math.abs(x)<31){out.planeGroup=70;return out;}
 let center:number,angle:number;
 if(x< -84){out.planeGroup=73;center=-100;angle=-5;}
 else if(x<0){out.planeGroup=71;center=-57;angle=-8;}
 else if(x>84){out.planeGroup=77;center=100;angle=5;}
 else{out.planeGroup=75;center=57;angle=8;}
 const multiply=(a:number,b:number)=>i16((Math.imul(i16(a),i16(b))+8192)>>14);
 if(i16(multiply(intSin(angle),z)+multiply(intCos(angle),i16(x-center)))<0)out.planeGroup++;
 return out;
}
