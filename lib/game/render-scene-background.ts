import {i16,intAtan2,intSin,intCos,vecTransform,type Vector} from '../physics/math.ts';
import type {Matrix} from '../physics/rotation.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {prepareOriginalLine} from './prepare-original-line.ts';
import {rasterOriginalPolygon} from './raster-original-polygon.ts';
import {originalBankedHorizon} from './banked-horizon.ts';
import {renderOriginalHorizonBackground,type OriginalPanoramaImage} from './render-horizon-background.ts';
export interface OriginalSceneBackgroundDrawing {
 fill(colour:number,start:number,end:number):void;
 panorama(rectangle:readonly number[],heading:number,horizon:number):void;
 polygon(points:readonly (readonly number[])[],clip:readonly number[],colour:number):void;
}
/** Original E09C..E77F full-redraw decisions, independent of pixel encoding. */
export function drawOriginalSceneBackground(memory:Uint8Array,d:number,rectangle:readonly number[],direction:number,matrix:Matrix,roll:number,heading:number,cameraHeight:number,drawing:OriginalSceneBackgroundDrawing,width=320,address:(offset:number)=>number=n=>n){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),s=(o:number)=>v.getInt16(d+address(o),true);
 const [, ,top,bottom]=rectangle,clip=[0,width,top,bottom],sky=s(0x9be2),ground=s(0x909e);
 const fill=(color:number,start=top,end=bottom)=>drawing.fill(color,start,end);
 const whole=(color:number)=>{fill(color);return 1;};
 const project=(vector:Vector)=>projectOriginalVector(vector,[s(0x4b88),s(0x4b8a)],[s(0x4b8c),s(0x4b8e)]);
 const panorama=(rect:readonly number[],h:number)=>drawing.panorama(rect,heading,h);
 if(roll===0){
  const vector=vecTransform([0,i16(-cameraHeight),i16(15000*direction)],matrix);
  if(vector[2]<0)return whole(sky);
  const horizon=Math.max(top,project(vector)[1]);
  if(direction===1){panorama(clip,horizon);return 0;}
  const groundHeight=Math.min(i16(horizon-top),i16(bottom-top));
  if(groundHeight>0)fill(ground,top,top+groundHeight);
  if(i16(bottom-horizon)>0)fill(sky,horizon,bottom);
  return 1;
 }
 const a=vecTransform([i16(18000*direction),i16(-cameraHeight),i16(15000*direction)],matrix);
 const b=vecTransform([i16(-18000*direction),i16(-cameraHeight),i16(15000*direction)],matrix);
 if(a[2]<0||b[2]<0)return whole(sky);
 const p=project(a),q=project(b);
 if(p[0]>width&&q[0]>width)return whole(p[1]<q[1]?sky:ground);
 if(p[0]<0&&q[0]<0)return whole(p[1]<=q[1]?ground:sky);
 if(p[1]>bottom&&q[1]>bottom)return whole(p[0]<=q[0]?ground:sky);
 if(p[1]<top&&q[1]<top)return whole(p[0]>=q[0]?ground:sky);
 if(memory[d+0x134]!==4&&q[0]<0&&p[0]>width){
  const line=prepareOriginalLine(q[0],q[1],p[0],p[1],clip,new Uint8Array(28));
  if(line.result===0){
   const r=new DataView(line.record.buffer,line.record.byteOffset,line.record.byteLength),x=r.getInt16(2,true),y0=r.getInt16(6,true),y1=r.getInt16(10,true);
   if(Math.abs(i16(y0-y1))<96&&(x===0||x===width-1)){
    const horizon=x===0?y0:y1,delta=i16((x===0?y1:y0)-horizon);
    originalBankedHorizon(top,bottom,heading,horizon,delta,s(0x9ae8),(rect,_heading,h)=>panorama(rect,h),width);return 0;
   }
  }
 }
 const angle=intAtan2(i16(p[0]-q[0]),i16(p[1]-q[1]))&1023,points=[p,q];
 for(let i=2;i<6;i++){
  const base=i<4?p:q,theta=i16(s(0x8ea+i*2)+angle);
  points.push([i16(base[0]+((Math.imul(16000,intSin(theta))+8192)>>14)),i16(base[1]+((Math.imul(16000,intCos(theta))+8192)>>14))]);
 }
 drawing.polygon([points[0],points[1],points[3],points[2]],clip,sky);
 drawing.polygon([points[0],points[1],points[4],points[5]],clip,ground);
 return 1;
}

/** Original MCGA indexed framebuffer adapter. */
export function renderOriginalSceneBackground(target:Uint8Array,memory:Uint8Array,d:number,rectangle:readonly number[],direction:number,matrix:Matrix,roll:number,heading:number,cameraHeight:number,imageAt:(offset:number,segment:number)=>OriginalPanoramaImage,width=320){
 return drawOriginalSceneBackground(memory,d,rectangle,direction,matrix,roll,heading,cameraHeight,{
  fill(colour,start,end){for(let y=start;y<end;y++)target.fill(colour&255,y*width,(y+1)*width);},
  panorama(rect,h,level){renderOriginalHorizonBackground(target,memory,d,rect,h,level,imageAt,width);},
  polygon(points,clip,colour){rasterOriginalPolygon(points,clip,colour,(x,y,count,c)=>target.fill(c,y*width+x,y*width+x+count));},
 },width);
}
