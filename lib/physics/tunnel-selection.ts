import type {Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Original tunnel branch 28 at 0x112f2-0x113ec. */
export function tunnelSelection(point:Vector,previous:Vector,roadSurface:number):ElevatedSelection{
 const [x,y]=point,[oldX,oldY,oldZ]=previous;
 const out:ElevatedSelection={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(y>=144||oldY>=144){if(Math.abs(x)<270){out.surface=roadSurface;out.planeGroup=133;}return out;}
 if(Math.abs(x)<120)out.surface=roadSurface;
 if(x>=120&&x<=270){
  out.wallUpper=144;
  if(oldZ<=-512)out.wall=154;else if(oldZ>=512)out.wall=153;else if(oldX<=120)out.wall=152;else if(oldX>=270)out.wall=150;
 }else if(x<=-120&&x>=-270){
  out.wallUpper=144;
  if(oldZ<=-512)out.wall=154;else if(oldZ>=512)out.wall=153;else if(oldX>=-120)out.wall=151;else if(oldX<=-270)out.wall=149;
 }
 return out;
}
