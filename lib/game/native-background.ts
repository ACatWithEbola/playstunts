import {Euler,Matrix4,Vector3} from 'three';
import {rotateZXY} from '../physics/rotation.ts';
import {i16,vecTransform,type Vector} from '../physics/math.ts';
import {renderOriginalSceneBackground} from './render-scene-background.ts';
import {projectOriginalVector} from './project-original-vector.ts';

/** Recover the original angle convention from the actual display camera.
 * The display reflects world Z; its local forward is original positive Z.
 */
export function backgroundCamera(position:readonly number[],target:readonly number[],up:readonly number[]){
 const forward=new Vector3(target[0]-position[0],target[1]-position[1],position[2]-target[2]).normalize();
 const vertical=new Vector3(up[0],up[1],-up[2]).normalize();
 const right=new Vector3().crossVectors(vertical,forward).normalize();
 vertical.crossVectors(forward,right).normalize();
 const e=new Euler().setFromRotationMatrix(new Matrix4().makeBasis(right,vertical,forward),'YXZ');
 return {angles:[-e.z,-e.x,-e.y].map(n=>Math.round(n*512/Math.PI)&1023) as Vector,height:Math.round(position[1])};
}

/** Original panorama artwork and background rules behind the GPU world.
 * 320x200 artwork keeps its original 4:3 display proportions. The optional
 * wider camera exposes more columns instead of stretching that artwork.
 * Original-size calls retain the executable-tested raster path.
 */
export function createNativeBackground(baseline:Uint8Array){
 const memory=baseline.slice(),d=0x2d1a0,v=new DataView(memory.buffer);
 let width=320,pixels=new Uint8Array(width*200);
 const imageAt=(offset:number,segment:number)=>{const a=segment*16+offset,w=v.getUint16(a,true),h=v.getUint16(a+2,true);return {width:w,height:h,pixels:memory.subarray(a+16,a+16+w*h)};};
 return {render(angles:Vector,height:number,aspect:number,fov:number,projection?:readonly number[],graphicsLevel?:number){
  if(graphicsLevel!==undefined)memory[d+0x134]=graphicsLevel;
  const nextWidth=Math.max(1,Math.round(240*aspect));
  if(nextWidth!==width){width=nextWidth;pixels=new Uint8Array(width*200);}
  const scale=100/Math.tan(fov*Math.PI/360);
  const projected=projection??[Math.round(width/2),100,Math.round(scale*1.2),Math.round(scale)];
  projected.forEach((n,i)=>v.setInt16(d+0x4b88+i*2,n,true));
  const matrix=rotateZXY(angles[0],angles[1],0,true),direction=vecTransform([0,0,1000],matrix)[2]>0?1:-1;
  const horizonVector=vecTransform([0,i16(-height),i16(15000*direction)],matrix);
  const panoramaHorizon=angles[0]===0&&direction===1&&horizonVector[2]>=0
   ?Math.max(0,projectOriginalVector(horizonVector,[projected[0]!,projected[1]!],[projected[2]!,projected[3]!])[1])
   :undefined;
  // DF2A advances one panorama pixel per heading unit. Center the extended
  // view on the same heading while leaving each sprite's pixel scale intact.
  // E09C receives the camera heading itself, not selectOriginalView's
  // opposite-facing tile-selection heading.
  const heading=(angles[2]+Math.round((width-320)/2))&1023;
  pixels.fill(v.getUint16(d+0x9be2,true)&255);
  renderOriginalSceneBackground(pixels,memory,d,[0,width,0,200],direction,matrix,angles[0],heading,height,imageAt,width);
  // Return the source colours as metadata instead of asking consumers to
  // infer them from a rendered pixel. A cloud can cover any sampled sky pixel
  // for a frame, while these are the stable values the original renderer uses
  // to clear the sky and ground before drawing panorama artwork.
  return {pixels,width,height:200,panoramaHorizon,sky:v.getUint16(d+0x9be2,true)&255,ground:v.getUint16(d+0x909e,true)&255};
 }};
}
