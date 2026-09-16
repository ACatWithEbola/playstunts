import {Euler,Matrix4,Vector3} from 'three';
import {rotateZXY} from '../physics/rotation.ts';
import {i16,vecTransform,type Vector} from '../physics/math.ts';
import {renderOriginalSceneBackground} from './render-scene-background.ts';
import {projectOriginalVector} from './project-original-vector.ts';

/** Recover the original angle convention from the actual display camera.
 * The display reflects world Z; its local forward is original positive Z.
 */
export function backgroundCamera(position:readonly number[],target:readonly number[],up:readonly number[],fractional=false){
 const forward=new Vector3(target[0]-position[0],target[1]-position[1],position[2]-target[2]).normalize();
 const vertical=new Vector3(up[0],up[1],-up[2]).normalize();
 const right=new Vector3().crossVectors(vertical,forward).normalize();
 vertical.crossVectors(forward,right).normalize();
 const e=new Euler().setFromRotationMatrix(new Matrix4().makeBasis(right,vertical,forward),'YXZ');
 return {angles:[-e.z,-e.x,-e.y].map(n=>fractional?(n*512/Math.PI%1024+1024)%1024:Math.round(n*512/Math.PI)&1023) as Vector,height:fractional?position[1]:Math.round(position[1])};
}

/** Interpolate only between the native projected horizon's integer inputs.
 * At every original endpoint this is the exact DOS projection; between them
 * it prevents the enhanced artwork stepping by a whole source-screen pixel. */
export function nativePanoramaHorizon(angles:Vector,height:number,projection:readonly number[],top=0){
 if(angles[0]!==0)return undefined;
 const at=(pitch:number,eyeHeight:number)=>{
  const matrix=rotateZXY(0,pitch,0,true);
  if(vecTransform([0,0,1000],matrix)[2]<=0)return undefined;
  const vector=vecTransform([0,i16(-eyeHeight),15000],matrix);
  return vector[2]>=0?Math.max(top,projectOriginalVector(vector,projection.slice(0,2),projection.slice(2,4))[1]):undefined;
 };
 const pitch=Math.floor(angles[1]),eye=Math.floor(height),pt=angles[1]-pitch,ht=height-eye;
 const a=at(pitch,eye),b=pt?at(pitch+1,eye):a,c=ht?at(pitch,eye+1):a,d=pt&&ht?at(pitch+1,eye+1):ht?c:b;
 if(a===undefined||b===undefined||c===undefined||d===undefined)return undefined;
 return (a+(b-a)*pt)*(1-ht)+(c+(d-c)*pt)*ht;
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
 return {render(angles:Vector,height:number,aspect:number,fov:number,projection?:readonly number[],graphicsLevel?:number,viewport?:readonly number[]){
  if(graphicsLevel!==undefined)memory[d+0x134]=graphicsLevel;
  const nextWidth=Math.max(1,Math.round(240*aspect));
  if(nextWidth!==width){width=nextWidth;pixels=new Uint8Array(width*200);}
  const scale=100/Math.tan(fov*Math.PI/360);
  const projected=projection??[Math.round(width/2),100,Math.round(scale*1.2),Math.round(scale)];
  projected.forEach((n,i)=>v.setInt16(d+0x4b88+i*2,n,true));
  const matrix=rotateZXY(angles[0],angles[1],0,true),direction=vecTransform([0,0,1000],matrix)[2]>0?1:-1;
  const rectangle=[0,width,viewport?.[2]??0,viewport?.[3]??200];
  const panoramaHorizon=nativePanoramaHorizon(angles,height,projected,rectangle[2]);
  // DF2A advances one panorama pixel per heading unit. Center the extended
  // view on the same heading while leaving each sprite's pixel scale intact.
  // E09C receives the camera heading itself, not selectOriginalView's
  // opposite-facing tile-selection heading.
  const heading=(angles[2]+Math.round((width-320)/2))&1023;
  pixels.fill(v.getUint16(d+0x9be2,true)&255);
  renderOriginalSceneBackground(pixels,memory,d,rectangle,direction,matrix,angles[0],heading,height,imageAt,width);
  // Return the source colours as metadata instead of asking consumers to
  // infer them from a rendered pixel. A cloud can cover any sampled sky pixel
  // for a frame, while these are the stable values the original renderer uses
  // to clear the sky and ground before drawing panorama artwork.
  return {pixels,width,height:200,panoramaHorizon,sky:v.getUint16(d+0x9be2,true)&255,ground:v.getUint16(d+0x909e,true)&255};
 }};
}
