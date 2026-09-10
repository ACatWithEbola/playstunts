import type {Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Original road barriers, physics 34 at 0x119d6..0x11abf. */
export function barrierSelection(point:Vector,previous:Vector,roadSurface:number):ElevatedSelection{
 const [x,,z]=point,[oldX,,oldZ]=previous;
 const out={planeGroup:0,surface:Math.abs(x)<120?roadSurface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(x>=23&&x<=97&&z> -271&&z< -241){
  out.wallUpper=42;
  if(oldZ< -271)out.wall=145;
  else if(oldZ> -241)out.wall=146;
  else if(oldX<23)out.wall=148;
  else if(oldX>97)out.wall=147;
 }else if(x<= -23&&x>= -97&&z<271&&z>241){
  out.wallUpper=42;
  if(oldZ>271)out.wall=141;
  else if(oldZ<241)out.wall=142;
  else if(oldX> -23)out.wall=143;
  else if(oldX< -97)out.wall=144;
 }
 return out;
}
