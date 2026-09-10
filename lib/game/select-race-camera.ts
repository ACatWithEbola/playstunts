import {i16,type Vector} from '../physics/math.ts';
import {cockpitEyeOffset} from './cockpit-eye-offset.ts';
import {originalOrbitCameraPlacement} from './orbit-camera-placement.ts';
import {originalExternalCameraClearance} from './external-camera-clearance.ts';
import {originalExternalCameraAngles} from './external-camera-angles.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';
/** Original BEEC..C25B camera selection for the focused car. */
export function selectOriginalRaceCamera(memory:Uint8Array,d:number,raw:number[],objects:TrackObject[],planes:CollisionPlane[],address:(mcga:number)=>number=n=>n){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),s=(at:number)=>v.getInt16(d+at,true),w=(at:number)=>v.getUint16(d+at,true),focus=memory[d+address(0xa9f0)],car=focus?address(0x8cf0):address(0x8c38);
 const position=[0,1,2].map(i=>i16(v.getInt32(d+car+i*4,true)>>6)) as Vector;
 const rotation=[0,1,2].map(i=>s(car+24+i*2)) as Vector,mode=memory[d+0x12f];
 if(mode===0){
  const eye=cockpitEyeOffset(rotation,s(address(0xa53a))),roll=rotation[2]&1023;
  return {position:position.map((n,i)=>i16(n+eye[i])) as Vector,angles:[roll>1&&roll<1023?roll:0,rotation[1]&1023,rotation[0]&1023] as Vector};
 }
 let camera:Vector;
 if(mode===1)camera=[0,1,2].map(i=>s(address(0x8c06)+(focus<<24>>24)*6+i*2)) as Vector;
 else if(mode===2)camera=originalOrbitCameraPlacement(position,rotation,s(0x126),s(0x128),s(0x12a));
 else if(mode===3){
  const index=memory[d+address(0x8ead)+(focus<<24>>24)]<<24>>24,offset=(w(address(0x8ff6))+index*6)&65535,segment=w(address(0x8ff8)),at=segment*16+offset;
  camera=[v.getInt16(at,true),i16(v.getInt16(at+2,true)+s(address(0x9334))+90),v.getInt16(at+4,true)];
 }else throw Error('Original camera mode requires retained caller locals: '+mode);
 camera=originalExternalCameraClearance(camera,raw,objects,planes,memory[d+address(0xa3c2)]);
 const angles=originalExternalCameraAngles(position,camera);
 return {position:camera,angles:[0,angles.pitch,angles.heading] as Vector};
}
