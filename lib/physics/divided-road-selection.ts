import type {Vector} from './math.ts';
/** Original divided road, 0x10c04..0x10c47. */
export function dividedRoadSelection(point:Vector,previous:Vector,roadSurface:number){
 const x=Math.abs(point[0]);
 const result={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(x>360)return result;
 if(x>120){result.surface=roadSurface;return result;}
 result.planeGroup=1;
 if(previous[0]<=-120)result.wall=188;
 else if(previous[0]>=120)result.wall=186;
 return result;
}
