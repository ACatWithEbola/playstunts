import {dividedEntrySelection} from './divided-entry-selection.ts';
import {dividedRoadSelection} from './divided-road-selection.ts';
import {largeCurvePaved} from './large-curve-surface.ts';
import {slopeTerrain} from './slope-terrain.ts';
import {slopeRoadMap} from './slope-road-map.ts';
/** First reconstructed build_track_object branches. Unsupported stunt/terrain
 * geometry raises an error rather than silently substituting a flat surface.
 */
import {baseTerrain} from './base-terrain.ts';
import { i16,intHypot,type Vector } from './math.ts';
import { surfaceHeightOffset } from './contact.ts';
import {scenerySelection} from './scenery-selection.ts';
import {barrierSelection} from './barrier-selection.ts';
import {twistedPipeSelection} from './twisted-pipe-selection.ts';
import {spiralSelection} from './spiral-selection.ts';
import {pipeSelection} from './pipe-selection.ts';
import {pipeEntrySelection} from './pipe-entry-selection.ts';
import {tunnelSelection} from './tunnel-selection.ts';
import {loopSelection} from './loop-selection.ts';
import { elevatedTrackSelection } from './elevated-track.ts';
export interface TrackObject {id:number;rotation:number;surface:number;multiTile:number;physics:number}
/** Full plane information for reconstructed single-tile branches on flat terrain.
 * The collision caller must also process any returned wall; plane selection
 * alone does not resolve the wall or the underside/crash branch.
 */
export function trackPlaneContact(raw:number[],objects:TrackObject[],point:Vector,previous:Vector,mode=0,retainedOrigin:Vector=[0,0,0]){
 const world=point.map(n=>i16(n>>6)) as Vector;
 const old=previous.map(n=>i16(n>>6)) as Vector;
 const column=world[0]>>10,row=world[2]>>10;
 if(column<0||column>=30||row<0||row>=30){
  // Original105F2..1060F takes the ordinary plane-zero grass tail. It
  // retains the prior X/Z origin, which has no effect on this horizontal
  // plane. Pure geometry callers use zero unless they own that memory.
  return {planeId:0,tileOrigin:[retainedOrigin[0],surfaceHeightOffset(4,world[0],world[2]),retainedOrigin[2]] as Vector,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true,rotation:0};
 }
 const terrain=raw[901+(29-row)*30+column];
 if(terrain>18)throw Error(`Terrain ${terrain} contact is not reconstructed yet`);
 const ground=baseTerrain(terrain>=7?0:terrain,world[0]-(column*1024+512),world[2]-(row*1024+512),450);
 let id=raw[row*30+column];
 const marker=id;
 if(marker===253)id=raw[(row+1)*30+column-1];
 else if(marker===254)id=raw[(row+1)*30+column];
 else if(marker===255)id=raw[row*30+column-1];
 let object=objects[id];
 if(!object||id>=253)throw Error('Original multi-tile anchor is missing');
 const tileOrigin:Vector=[column*1024+512,0,row*1024+512];
 if(object.multiTile&1)tileOrigin[2]=(row+(marker===253||marker===254?1:0))*1024;
 if(object.multiTile&2)tileOrigin[0]=(column+(marker===253||marker===255?0:1))*1024;
 if(terrain>=7&&terrain<=10&&id!==0){id=slopeRoadMap(terrain,id);object=objects[id];}
 // Original0x108f8 increments the byte, then clamps signed values below1.
 const surfaceByte=object.surface&255;
 object={...object,surface:surfaceByte>=1&&surfaceByte<128?surfaceByte:1};
 const local=(v:Vector):Vector=>{
  let x=i16(v[0]-tileOrigin[0]),z=i16(v[2]-tileOrigin[2]);
  if(object.rotation===256)[x,z]=[i16(-z),x];else if(object.rotation===512)[x,z]=[i16(-x),i16(-z)];else if(object.rotation===768)[x,z]=[z,i16(-x)];
  return [x,i16(v[1]-ground.height),z];
 };
 const selection=![10,11,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,65,66,67,68,69,70].includes(object.physics)?flatSelection(object,local(world),mode):object.physics===10?dividedEntrySelection(local(world),local(old),object.surface):object.physics===11?dividedRoadSelection(local(world),local(old),object.surface):object.physics>=65&&object.physics<=70?scenerySelection(object.physics,local(world),local(old)):object.physics===34?barrierSelection(local(world),local(old),object.surface):object.physics===35?twistedPipeSelection(local(world),object.surface):object.physics===32||object.physics===33?spiralSelection(object.physics,local(world),object.surface):object.physics===30||object.physics===31?pipeSelection(object.physics,local(world),local(old),object.surface):object.physics===29?pipeEntrySelection(local(world),local(old),object.surface):object.physics===28?tunnelSelection(local(world),local(old),object.surface):object.physics===27?loopSelection(local(world),object.surface):elevatedTrackSelection(object.physics,local(world),local(old),object.surface);
 let rotation=object.rotation;
 if(terrain>=7){const slope=slopeTerrain(terrain,world[0]-(column*1024+512),world[2]-(row*1024+512),selection.planeGroup,ground.height);selection.planeGroup=slope.planeGroup;ground.height=slope.height;rotation=slope.rotation;}
 const orientation=((1024-rotation)&1023)>>8;
 const planeId=selection.planeGroup===0?0:selection.planeGroup*4+orientation;
 if(selection.surface===4)selection.surface=ground.surface;
 tileOrigin[1]=ground.height+surfaceHeightOffset(selection.surface,world[0],world[2]);
 const {planeGroup:_,...details}=selection;
 return {planeId,tileOrigin,...details,rotation};
}
export function levelTrackContact(raw:number[],objects:TrackObject[],point:Vector){
 const worldX=i16(point[0]>>6),worldZ=i16(point[2]>>6);
 const column=worldX>>10,row=worldZ>>10;
 if(column<0||column>=30||row<0||row>=30)return {surface:4,height:surfaceHeightOffset(4,worldX,worldZ)};
 const terrain=raw[901+(29-row)*30+column];
 if(terrain>6)throw Error(`Terrain ${terrain} contact is not reconstructed yet`);
 const id=raw[row*30+column],object=objects[id];
 if(!object||object.multiTile||id>=253)throw Error(`Multi-tile track element ${id} contact is not reconstructed yet`);
 let x=worldX-(column*1024+512),z=worldZ-(row*1024+512);
 if(object.rotation===256)[x,z]=[-z,x];else if(object.rotation===512)[x,z]=[-x,-z];else if(object.rotation===768)[x,z]=[z,-x];
 const ground=baseTerrain(terrain,worldX-(column*1024+512),worldZ-(row*1024+512),450);
 const selected=flatSelection(object,[x,i16((point[1]>>6)-ground.height),z]);
 const surface=selected.surface===4?ground.surface:selected.surface;
 return {surface,height:ground.height+surfaceHeightOffset(surface,worldX,worldZ)};
}

function flatSelection(object:TrackObject,[x,y,z]:Vector,mode=0){
 const planeGroup=object.physics===0&&mode===0&&x>0?(z<-380?131:z<-300?132:0):0;
 let paved=false;
 switch(object.physics){
  case 0:case 1:paved=Math.abs(x)<120;break;
  case 2:{const radius=intHypot(i16(x+512),i16(z+512));paved=radius>392&&radius<632;break}
  case 4:case 5:paved=true;break; // Original sets road surface before its radial checks.
  case 3:case 8:case 9:paved=largeCurvePaved(object.physics,x,z);break;
  case 6:case 7:{const radius=intHypot(i16((object.physics===6?x:-x)+512),i16(z+512));paved=Math.abs(x)<120||(radius>392&&radius<632);break}
  case 22:if(y>390)throw Error('Elevated overpass contact is not reconstructed yet');paved=Math.abs(z)<=120;break;
  case 12:paved=Math.abs(x)<120||Math.abs(z)<120;break;
  case 13:case 14:case 15:case 64:case 71:case 72:case 73:case 74:break;
  default:throw Error(`Track physics model ${object.physics} contact is not reconstructed yet`);
 }
 return {planeGroup,surface:paved?object.surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
}
