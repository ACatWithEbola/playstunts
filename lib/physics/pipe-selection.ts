import type {Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Original pipe branches 30/31 at 0x1151c-0x11708. */
export function pipeSelection(physics:30|31,point:Vector,previous:Vector,roadSurface:number):ElevatedSelection{
 const [x,y,z]=point,[oldX,,oldZ]=previous;
 const out:ElevatedSelection={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(Math.abs(oldX)>=164&&Math.abs(x)<=164){out.wallUpper=151;out.wall=oldX>0?155:156;return out;}
 if(Math.abs(x)>=164||y>=265)return out;
 if(Math.abs(x)<130)out.surface=roadSurface;
 const upper=y>151;
 if(physics===31&&!upper&&Math.abs(x)<=84&&Math.abs(z)<=75){
  out.planeGroup=69;
  if(oldZ<=-75)out.wall=157;else if(oldZ>=75)out.wall=158;
  return out;
 }
 if(y>88&&!upper)out.planeGroup=x<0?60:66;
 else if(Math.abs(x)<31)out.planeGroup=upper?63:57;
 else if(x< -84)out.planeGroup=upper?61:59;
 else if(x<0)out.planeGroup=upper?62:58;
 else if(x>84)out.planeGroup=upper?65:67;
 else out.planeGroup=upper?64:68;
 return out;
}
