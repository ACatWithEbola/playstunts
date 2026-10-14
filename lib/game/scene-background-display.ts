import {drawOriginalSceneBackground} from './render-scene-background.ts';
import {drawOriginalHorizonBackground} from './horizon-background.ts';
import {BACKGROUND_DISPLAY_LAYOUTS} from './background-display-layout.ts';
import type {Matrix} from '../physics/rotation.ts';
import {ms91ForwardSkyRegion,ms91FullSkyRegion,ms91RolledSkyRegion} from './ms91-sky-region.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
interface Ms91RolledBackgroundHost {ms91RolledRepaintPlan?(clip:Ms91Rectangle,base:number,delta:number):{clearSky:Ms91Rectangle[];clearGround:Ms91Rectangle[];panorama:Ms91Rectangle|null}}
export interface OriginalSceneBackgroundDisplayHost extends Ms91RolledBackgroundHost {bounds(left:number,right:number,top:number,bottom:number):void;clearWindow(colour:number):void;bitmap(pointer:{offset:number;segment:number},position:{x:number;y:number}):void;polygon(points:readonly (readonly number[])[],colour:number,scratch:{leftOffset:number;rightOffset:number}):void;retainMs91SkyRegion?(rectangle:Ms91Rectangle):void;ms91SkyRepaintRegions?(clip:Ms91Rectangle,heading:number):readonly Ms91Rectangle[];ms91FullRedraw?:boolean;}
/** Native driver rendering for original DF2A panorama and E09C background. */
export function drawOriginalSceneBackgroundDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalSceneBackgroundDisplayHost,rectangle:readonly number[],direction:number,matrix:Matrix,roll:number,heading:number,cameraHeight:number,scratch:{leftOffset:number;rightOffset:number}){
 const address=BACKGROUND_DISPLAY_LAYOUTS[mode];
 const result=drawOriginalSceneBackground(memory,d,rectangle,direction,matrix,roll,heading,cameraHeight,{
  fill(colour,start,end){host.bounds(0,320,start,end);host.clearWindow(colour);},
  panorama(rect,h,level){
   if(roll===0&&host.retainMs91SkyRegion){const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);host.retainMs91SkyRegion(ms91ForwardSkyRegion(level,v.getUint16(d+address(0x9ae2),true),memory[d+0x134]));}
   const regions=roll===0&&host.ms91SkyRepaintRegions?host.ms91SkyRepaintRegions(Array.from(rect) as Ms91Rectangle,h):[rect];
   for(const region of regions)drawOriginalHorizonBackground(memory,d,region,h,level,command=>{const a=command.args;if(command.address===0x250b3)host.bounds(a[0],a[1],a[2],a[3]);else if(command.address===0x250f4)host.clearWindow(a[0]);else host.bitmap({offset:a[0],segment:a[1]},{x:a[2],y:a[3]});},address);
  },
  polygon(points,clip,colour){host.bounds(clip[0],clip[1],clip[2],clip[3]);host.polygon(points,colour,scratch);},
  rolledHorizon(base,delta){
   const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
   host.retainMs91SkyRegion?.(ms91RolledSkyRegion(base,delta,v.getUint16(d+address(0x9ae2),true),Array.from(rectangle) as Ms91Rectangle,!!host.ms91FullRedraw));
   const plan=host.ms91RolledRepaintPlan?.(Array.from(rectangle) as Ms91Rectangle,base,delta);if(!plan)return;
   for(const [regions,color] of [[plan.clearSky,v.getUint16(d+address(0x9be2),true)],[plan.clearGround,v.getUint16(d+address(0x909e),true)]] as const)for(const region of regions){host.bounds(...region);host.clearWindow(color);}
   return plan.panorama;
  },
 },320,address);
 if(result&&host.retainMs91SkyRegion)host.retainMs91SkyRegion(ms91FullSkyRegion(Array.from(rectangle) as Ms91Rectangle));
 return result;
}
