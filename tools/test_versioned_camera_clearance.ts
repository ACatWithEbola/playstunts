import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {originalExternalCameraClearance} from '../lib/game/external-camera-clearance.ts';
import {selectOriginalRaceCamera} from '../lib/game/select-race-camera.ts';
import {originalExternalCamera} from '../lib/game/original-external-camera.ts';
import {continuousExternalCamera} from '../lib/game/continuous-external-camera.ts';
import {createEnhancedChaseCamera,ENHANCED_CHASE_CAMERA_PRESETS} from '../lib/game/enhanced-chase-camera.ts';
import {trackPlaneContact} from '../lib/physics/track.ts';
import {planeDistance} from '../lib/physics/plane.ts';
import {i16,vecTransform,type Vector} from '../lib/physics/math.ts';
const tile=fixtureData.objects.findIndex((object:{physics:number;rotation:number})=>object.physics===35&&object.rotation===0);
assert.ok(tile>=0);
const raw=new Array(1802).fill(0);raw[310]=tile;
const eye:Vector=[10892,100,10352],before=raw.slice(),point=eye.map(value=>value*64) as Vector;
const contact=trackPlaneContact(raw,fixtureData.objects,point,point,0,undefined,'ms-1991');
assert.equal(contact.planeId,264);
const plane=fixtureData.planes[contact.planeId],distance=planeDistance(eye,plane,contact.tileOrigin);
assert.equal(distance,-25);
const correction=vecTransform([0,i16(12-distance),0],plane.rotation);
const expected=eye.map((value,index)=>i16(value+correction[index])) as Vector;
assert.notDeepEqual(expected,eye);
for(const engine of [undefined,'ms-1990','ms-1991','bb-1991'] as const){
 const modern=engine==='ms-1991'||engine==='bb-1991';
 assert.deepEqual(originalExternalCameraClearance(eye,raw,fixtureData.objects,fixtureData.planes,0,engine),modern?expected:eye);
 const d=0x2d1a0,memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);memory[d+0x12f]=1;
 eye.forEach((value,index)=>view.setInt16(d+0x8c06+index*2,value,true));
 const snapshot=memory.slice();
 assert.deepEqual(selectOriginalRaceCamera(memory,d,raw,fixtureData.objects,fixtureData.planes,undefined,engine).position,modern?expected:eye);
 assert.deepEqual(memory,snapshot);
 assert.deepEqual(originalExternalCamera(eye,[0,0,0],raw,fixtureData.objects,fixtureData.planes,0,0,0,0,engine).position,modern?expected:eye);
 const continuous=continuousExternalCamera({position:eye.map(value=>value*64) as Vector,rotation:[0,0,0]},raw,fixtureData.objects,fixtureData.planes,0,0,0,0,engine);
 const expectedDisplay=(modern?expected:eye).map((value,index)=>index===2?-value:value);
 assert.deepEqual(continuous.position,expectedDisplay);
 const preset=ENHANCED_CHASE_CAMERA_PRESETS[1];
 const chase=createEnhancedChaseCamera({raw,objects:fixtureData.objects,planes:fixtureData.planes,physicsEngine:engine});
 const result=chase.sample({position:[eye[0],eye[1]-preset.height,eye[2]+preset.distance],rotation:[0,0,0]},1,0,1000,1,0);
 result.position.forEach((value,index)=>assert.ok(Math.abs(value-expectedDisplay[index])<1e-8,'Chase clearance must follow recorded identity'));
}
assert.deepEqual(raw,before);assert.deepEqual(eye,[10892,100,10352]);
for(const [file,argument] of [
 ['lib/game/native-original-renderer.ts','undefined,physicsEngine'],
 ['lib/game/native-display-race-renderer.ts','a,metadata.physicsEngine'],
 ['lib/game/upgraded-race-scene.ts','physicsEngine:runtime.session.physicsEngine'],
 ['lib/game/enhanced-chase-camera.ts','mode,track.physicsEngine'],
] as const)assert.ok(readFileSync(file,'utf8').includes(argument),file+' must pass session identity to camera selection');
console.log('Recorded engine selects corkscrew camera clearance; legacy fallback and source memory stay unchanged');
