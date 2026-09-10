import type {Vector} from './math.ts';
// Supplied original DS:2e8c, DS:2e9a, DS:2ea8.
const zBounds=[-512,-334,-168,0,168,334,1000];
const inner=[0,0,0,0,0,120,120],outer=[120,168,216,264,312,360,360];
/** Original physics10, 0x10af0..0x10c00. */
export function dividedEntrySelection([x,_y,z]:Vector,previous:Vector,roadSurface:number){
 const result={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 let section=0;while(section<5&&zBounds[section+1]<z)section++;
 const bound=(values:number[])=>values[section]+Math.trunc((values[section+1]-values[section])*(z-zBounds[section])/(zBounds[section+1]-zBounds[section]));
 const absX=Math.abs(x);
 if(absX>bound(inner)&&absX<bound(outer)){result.surface=roadSurface;return result;}
 if(z<0||absX>120)return result;
 result.planeGroup=1;
 if(z<334)result.wall=previous[0]<0?189:187;
 else if(previous[0]<=-120)result.wall=188;
 else if(previous[0]>=120)result.wall=186;
 return result;
}
