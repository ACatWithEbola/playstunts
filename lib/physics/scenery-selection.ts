import type {Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
// xmin,xmax,z extent,height, walls for -z,+z,-x,+x, from 0x11ac2..0x11d96.
const bounds:Record<number,number[]>={
 65:[-150,150,150,425,161,162,164,163],
 66:[-200,260,80,230,165,168,166,167],
 67:[-180,180,100,248,169,172,171,170],
 68:[-200,200,200,550,173,174,175,176],
 69:[-114,114,114,495,180,178,177,179],
 70:[-170,260,110,230,181,184,183,182],
};
export function scenerySelection(physics:number,point:Vector,previous:Vector):ElevatedSelection{
 const b=bounds[physics];if(!b)throw Error(`Unreconstructed scenery physics ${physics}`);
 const [xmin,xmax,zmax,height,back,front,left,right]=b;
 const [x,,z]=point,[oldX,,oldZ]=previous;
 const out={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 if(x<xmin||x>xmax||Math.abs(z)>zmax)return out;
 out.wallUpper=height;
 if(oldZ<=-zmax)out.wall=back;
 else if(oldZ>=zmax)out.wall=front;
 else if(oldX<=xmin)out.wall=left;
 else if(oldX>=xmax)out.wall=right;
 return out;
}
