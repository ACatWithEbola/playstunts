import {i16,intAtan2,intHypot,type Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Original branches 32/33, physical 0x11884..0x119d3.
 * special preserves DS:935a for the caller's collision handling.
 */
export function spiralSelection(physics:32|33,point:Vector,roadSurface:number):ElevatedSelection&{special:boolean}{
 const [rawX,y,z]=point,x=physics===32?i16(-rawX):rawX;
 const base=physics===32?79:105,outer=physics===32?50:0,inner=physics===32?75:25;
 const out={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true,special:true};
 if(z<0&&y<100&&x>0){if(x<632&&x>392){out.surface=roadSurface;out.planeGroup=base;}return out;}
 if(z>0&&y>350&&x<692&&x>332){out.wallUpper=42;out.wallLower=-12;out.wall=(x>512?outer:inner)+24;out.surface=roadSurface;out.planeGroup=base+25;out.underside=false;return out;}
 const radius=intHypot(x,z);
 if(radius<=332||radius>=692)return out;
 const section=((256-intAtan2(x,z))&1023)*24>>10;
 out.planeGroup=base+section+1;out.surface=roadSurface;out.underside=false;out.wallUpper=42;out.wallLower=-12;
 if(radius-512>90)out.wall=outer+section;else if(radius-512< -90)out.wall=inner+section;
 return out;
}
