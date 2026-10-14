import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fixtureData} from './global-score-fixture.ts';
import {bodyPlanePoints} from '../lib/physics/body-plane-points.ts';
import {bodyPlaneContact} from '../lib/physics/body-plane-contact.ts';
import type {Vector} from '../lib/physics/math.ts';
import {readPlayerDrivingState} from '../lib/game/initialized-player-driving.ts';
import {moveTrack} from '../lib/physics/track-step.ts';
const [image,libraries,replay,game,car,probe]=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game&&car);
assert.ok(!probe||probe==='--tunnel'||probe==='--moving-tunnel','Unknown probe');
const root=mkdtempSync(join(tmpdir(),'ms91-body-exits-')),sourceBytes=readFileSync(replay);
let stagedReplay=replay;
if(probe){const bytes=Uint8Array.from(sourceBytes);assert.equal(bytes[26+13*30+10],4,'Tunnel fixture requires a vertical straight');bytes[26+13*30+10]=66;stagedReplay=join(root,'TUNNEL.RPL');writeFileSync(stagedReplay,bytes,{flag:'wx'});}
const args=['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',stagedReplay,'--game',game,'--analyze','--car',car,'--position','690432','0',probe?'871296':'805760'];
const execute=(extra:string[])=>{const r=spawnSync('python3',[...args,...extra],{encoding:'utf8',maxBuffer:4000000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
const initial=execute([]),raw=Buffer.from(initial.carInitialized.raw,'hex'),sim=Buffer.from(initial.carInitialized.tuning,'hex'),sv=new DataView(sim.buffer,sim.byteOffset,sim.byteLength);
const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>sv.getInt16(210+i*6+a*2,true)) as Vector);
let collisions=0,checked=0;
const trackBytes=readFileSync(stagedReplay),track=Array.from(trackBytes.subarray(26,1828));
const cases=probe==='--moving-tunnel'?[80,120,140].flatMap(height=>[0x1000,0x4000,0x8000].map(speed=>({roll:0,height,speed}))):probe?[80,120,140,160,180].map(height=>({roll:0,height,speed:0})):[0,128,256,384,512,640,768,896].map(roll=>({roll,height:undefined,speed:0}));
for(const {roll,height,speed} of cases){
 const state=Uint8Array.from(raw),v=new DataView(state.buffer);v.setInt16(28,roll,true);
 if(height!==undefined){v.setInt32(4,height*64,true);v.setInt32(16,height*64,true);}
 if(speed){for(const offset of [42,44,46])v.setUint16(offset,speed,true);}
 const path=join(root,'roll-'+roll+'-height-'+height+'-speed-'+speed+'.bin');writeFileSync(path,state,{flag:'wx'});
 const result=execute(['--chassis-step','--car-state',path]),c=result.chassis;
 assert.ok(c.bodyEvents.some((e:{bodyLoopReached?:boolean})=>e.bodyLoopReached),'Probe must enter original body contact');
 const previous=Array.from({length:4},(_,i)=>[0,1,2].map(a=>v.getInt16(140+i*6+a*2,true)) as Vector);
 const points=bodyPlanePoints(c.proposedPose.position,c.proposedPose.rotation,wheels,sv.getInt16(202,true));
 const contact=bodyPlaneContact(points,previous,{raw:track,objects:fixtureData.objects,planes:fixtureData.planes},0);
 const bodyStart=c.bodyEvents.findIndex((e:{bodyLoopReached?:boolean})=>e.bodyLoopReached);
 const crashed=c.bodyEvents.slice(bodyStart).some((e:{crashRequest?:number})=>e.crashRequest===5);
 assert.equal(contact.crash,crashed,'Original body crash at roll '+roll);
 const after=Buffer.from(c.after,'hex'),av=new DataView(after.buffer,after.byteOffset,after.byteLength);
 const cache=Array.from({length:4},(_,i)=>[0,1,2].map(a=>av.getInt16(140+i*6+a*2,true)) as Vector);
 assert.deepEqual(contact.cache,cache,'Partial body cache at roll '+roll);
 const canonical=new Uint8Array(65536);
 canonical.set(state.subarray(0,140),0x8c38);canonical.set(state.subarray(164),0x8c38+140);
 const before=readPlayerDrivingState(canonical).driving.car;before.bodyPlaneCache=previous;
 // This isolated chassis entry starts with a zeroed emulated stack, unlike
 // the full player caller which retains engine/grip scratch in these slots.
 before.contactWheelAngles=[0,0,0,0];
 const moved=moveTrack(before,wheels,{raw:track,objects:fixtureData.objects,planes:fixtureData.planes,walls:fixtureData.walls,physicsEngine:'ms-1991',mode:0,runtimeMode:0,landmarks:{dimensions:[0,1,2].map(a=>sv.getInt16(200+a*2,true)) as Vector,radius:sv.getInt16(206,true),hillHeight:384}},before.engine,before.grip,before.engine.roadSpeed);
 assert.deepEqual(moved.bodyPlaneCache,cache,'Integrated body cache at roll '+roll);
 assert.equal(moved.grip.crash,av.getUint8(201),'Integrated crash status at roll '+roll);
 assert.equal(moved.engine.roadSpeed,av.getUint16(44,true),'Integrated road speed at roll '+roll);
 assert.deepEqual(moved.pose.position,[0,4,8].map(o=>av.getInt32(o,true)),'Integrated position at roll '+roll);
 assert.deepEqual(moved.pose.rotation,[24,26,28].map(o=>av.getInt16(o,true)),'Integrated orientation at roll '+roll);
 checked++;collisions+=Number(crashed);
 console.log(JSON.stringify({roll,height,speed,originalBodyCrash:c.bodyEvents,componentCrash:contact.crash}));
}
assert.ok(collisions>0,'A collision-exit corpus must exercise actual collisions');
assert.deepEqual(readFileSync(replay),sourceBytes);
console.log(JSON.stringify({car,probe:probe??'roll',checked,collisions,comparisonComplete:true,sourceUnchanged:true}));
