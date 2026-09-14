import * as THREE from 'three';
import {createCarModel} from './car-model.ts';
import type {RenderPose} from './render-pose.ts';
import type {Assets} from './types.ts';
import type {TrackMaterials} from './track-model.ts';

const D=0x2d1a0;
const ANGLE=Math.PI/512;

type FragmentChoice={owner:0|1;style:number;model:THREE.Group};
type ParticleSnapshot={x:number;y:number;z:number;angleX:number;angleZ:number;heading:number;speed:number;style:number;owner:number};

function blendNumber(before:number,after:number,fraction:number){return before+(after-before)*fraction;}
function blendAngle(before:number,after:number,fraction:number){
 const delta=((((after-before+512)%1024)+1024)%1024)-512;
 return before+delta*fraction;
}

function originalFireballTexture(memory:Uint8Array,palette:readonly number[],frame:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const offset=view.getUint16(D+0xa3cc+frame*4,true),segment=view.getUint16(D+0xa3ce+frame*4,true),at=segment*16+offset;
 const width=view.getUint16(at,true),height=view.getUint16(at+2,true);
 if(!width||!height||at+16+width*height>memory.length)return;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d');if(!context)return;
 const image=context.createImageData(width,height);
 for(let index=0;index<width*height;index++){
  const source=memory[at+16+index],target=index*4;
  if(source===255){image.data[target+3]=0;continue;}
  image.data[target]=palette[source*3]??0;image.data[target+1]=palette[source*3+1]??0;image.data[target+2]=palette[source*3+2]??0;image.data[target+3]=255;
 }
 context.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
 return {texture,width,height,anchorX:view.getUint16(at+4,true),anchorY:view.getUint16(at+6,true)};
}

/** Enhanced-camera presentation of the source crash system. Simulation-owned
 * particle positions, rotations, styles and three-frame fireball timing are
 * read only; this adapter merely gives them a camera-independent 3D view. */
export function createEnhancedCrashEffects(options:{assets:Assets;memory:Uint8Array;materials:TrackMaterials;carIds:readonly string[];paints:readonly number[];world:THREE.Group;scene:THREE.Scene}){
 const fragmentTemplates=options.carIds.map((id,owner)=>Array.from({length:4},(_,style)=>{
  const shape=options.assets.shapes['ST'+id]?.['exp'+style];if(!shape)return;
  const model=createCarModel(shape,0xffffff,{...options.materials,paint:options.paints[owner]??0});model.scale.setScalar(400);model.visible=false;return model;
 }));
 const fragments=Array.from({length:24},()=>{
  const group=new THREE.Group(),choices:FragmentChoice[]=[];
  fragmentTemplates.forEach((templates,owner)=>templates.forEach((template,style)=>{if(!template)return;const model=template.clone(true);group.add(model);choices.push({owner:owner as 0|1,style,model});}));
  group.visible=false;options.world.add(group);return {group,choices};
 });
 const fireballFrames=Array.from({length:3},(_,frame)=>originalFireballTexture(options.memory,options.materials.palette,frame));
 const fireballs=options.carIds.map((id,owner)=>{
  const shape=options.assets.shapes['ST'+id]?.car1;
  const spans=[0,1,2].map(axis=>shape?Math.max(...shape.vertices.map(vertex=>vertex[axis]))-Math.min(...shape.vertices.map(vertex=>vertex[axis])):1024);
  const extent=Math.max(...spans),sprite=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:true,toneMapped:false,alphaTest:.01}));
  sprite.visible=false;sprite.renderOrder=1000;sprite.userData.crashOwner=owner;options.scene.add(sprite);return {sprite,extent};
 });
 let previousParticles:ParticleSnapshot[]|undefined,currentParticles:ParticleSnapshot[]|undefined,particleFrame=-1,particleAt=0,particleLastAt=0;
 const readParticles=(live:Uint8Array)=>{
  const data=new DataView(live.buffer,live.byteOffset,live.byteLength);
  return Array.from({length:24},(_,index)=>({
   x:data.getInt32(D+0x8ae6+index*4,true),y:data.getInt32(D+0x8b46+index*4,true),z:data.getInt32(D+0x8ba6+index*4,true),
   angleX:data.getInt16(D+0x8db4+index*2,true),angleZ:data.getInt16(D+0x8de4+index*2,true),heading:data.getInt16(D+0x8e14+index*2,true),
   speed:data.getUint16(D+0x8e44+index*2,true),style:live[D+0x8ee1+index],owner:live[D+0x8ef9+index],
  }));
 };
 const hide=()=>{for(const fragment of fragments)fragment.group.visible=false;for(const fireball of fireballs)fireball.sprite.visible=false;};
 return {
  group:fragments,
  update(live:Uint8Array,poses:readonly RenderPose[],sourceFrame:number,now:number,enabled:boolean){
   if(!enabled){hide();return;}
   const nextParticles=readParticles(live);
   const reset=!currentParticles||sourceFrame<particleFrame||sourceFrame-particleFrame>1||now-particleLastAt>200;
   if(reset){previousParticles=nextParticles;currentParticles=nextParticles;particleAt=now;}
   else if(sourceFrame!==particleFrame){
    const beforeParticles=currentParticles!;
    currentParticles=nextParticles;
    // A newly occupied slot must appear at its generated position rather than
    // fly in from stale data left by the previous use of that shared slot.
    previousParticles=beforeParticles.map((particle,index)=>particle.speed&&particle.owner===nextParticles[index].owner&&particle.style===nextParticles[index].style?particle:nextParticles[index]);
    particleAt=now;
   }else currentParticles=nextParticles;
   particleFrame=sourceFrame;particleLastAt=now;
   const fraction=Math.max(0,Math.min(1,(now-particleAt)/50));
   const particleBefore=previousParticles!,particleAfter=currentParticles!;
   for(let index=0;index<fragments.length;index++){
    const before=particleBefore[index],after=particleAfter[index],owner=after.owner,style=after.style-(owner===0?4:8),fragment=fragments[index];
    const visible=after.speed!==0&&(owner===0||owner===1)&&style>=0&&style<4;
    fragment.group.visible=visible;if(!visible)continue;
    const car=poses[owner].position;
    fragment.group.position.set(car[0]+blendNumber(before.x,after.x,fraction)/64,car[1]+blendNumber(before.y,after.y,fraction)/64,car[2]+blendNumber(before.z,after.z,fraction)/64);
    fragment.group.rotation.set(-blendAngle(before.angleZ,after.angleZ,fraction)*ANGLE,-blendAngle(before.heading,after.heading,fraction)*ANGLE,-blendAngle(before.angleX,after.angleX,fraction)*ANGLE,'YXZ');
    for(const choice of fragment.choices)choice.model.visible=choice.owner===owner&&choice.style===style;
   }
   const frame=fireballFrames[(sourceFrame>>>2)%3];
   fireballs.forEach(({sprite,extent},owner)=>{
    const crash=owner?live[D+0x8da1]:live[D+0x8ce9];
    sprite.visible=crash===1&&!!frame;if(!sprite.visible||!frame)return;
    const pose=poses[owner];sprite.position.set(pose.position[0],pose.position[1]+extent*.18,-pose.position[2]);
    if(sprite.material.map!==frame.texture){sprite.material.map=frame.texture;sprite.material.needsUpdate=true;}
    sprite.center.set(frame.anchorX/frame.width,1-frame.anchorY/frame.height);sprite.scale.set(extent,extent*frame.height/frame.width,1);
   });
  },
  close(){for(const frame of fireballFrames)frame?.texture.dispose();for(const fireball of fireballs){fireball.sprite.material.dispose();options.scene.remove(fireball.sprite);}},
 };
}
