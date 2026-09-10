import type {Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
// Original DS:2e5c and DS:2e74, indexed by cross-section segment.
const lower=[0,-94,-187,-280,-373,-466,-559,-652,-745,-838,-931,-1024];
const upper=[0,1024,931,838,745,652,559,466,373,280,187,94];
/** Original physics 35 at 0x1170c..0x11880. */
export function twistedPipeSelection(point:Vector,roadSurface:number):ElevatedSelection&{special:boolean}{
 const [x,y,z]=point;
 const out={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true,special:false};
 if(Math.abs(x)>=130||y>=265)return out;
 out.surface=roadSurface;
 const high=y>151;
 let section:number;
 if(y>88&&!high)section=x<0?3:9;
 else if(Math.abs(x)<31)section=high?6:0;
 else if(x< -84)section=high?4:2;
 else if(x<0)section=high?5:1;
 else if(x>84)section=high?8:10;
 else section=high?7:11;
 if(section!==0&&z>lower[section]&&z<upper[section])out.planeGroup=57+section;
 if(out.planeGroup===0&&Math.abs(z)<512){out.wall=185;out.special=true;out.wallUpper=117;}
 return out;
}
