import {drawOriginalSceneBackground} from './render-scene-background.ts';
import {drawOriginalHorizonBackground} from './horizon-background.ts';
import {BACKGROUND_DISPLAY_LAYOUTS} from './background-display-layout.ts';
import type {Matrix} from '../physics/rotation.ts';
export interface OriginalSceneBackgroundDisplayHost {bounds(left:number,right:number,top:number,bottom:number):void;clearWindow(colour:number):void;bitmap(pointer:{offset:number;segment:number},position:{x:number;y:number}):void;polygon(points:readonly (readonly number[])[],colour:number,scratch:{leftOffset:number;rightOffset:number}):void;}
/** Native driver rendering for original DF2A panorama and E09C background. */
export function drawOriginalSceneBackgroundDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalSceneBackgroundDisplayHost,rectangle:readonly number[],direction:number,matrix:Matrix,roll:number,heading:number,cameraHeight:number,scratch:{leftOffset:number;rightOffset:number}){
 const address=BACKGROUND_DISPLAY_LAYOUTS[mode];
 return drawOriginalSceneBackground(memory,d,rectangle,direction,matrix,roll,heading,cameraHeight,{
  fill(colour,start,end){host.bounds(0,320,start,end);host.clearWindow(colour);},
  panorama(rect,h,level){drawOriginalHorizonBackground(memory,d,rect,h,level,command=>{const a=command.args;if(command.address===0x250b3)host.bounds(a[0],a[1],a[2],a[3]);else if(command.address===0x250f4)host.clearWindow(a[0]);else host.bitmap({offset:a[0],segment:a[1]},{x:a[2],y:a[3]});},address);},
  polygon(points,clip,colour){host.bounds(clip[0],clip[1],clip[2],clip[3]);host.polygon(points,colour,scratch);},
 },320,address);
}
