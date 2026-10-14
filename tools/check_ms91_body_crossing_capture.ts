/** Targeted complete-chassis probes; synthetic cache history, never scores. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fixtureData} from './global-score-fixture.ts';
import {readPlayerDrivingState} from '../lib/game/initialized-player-driving.ts';
import {moveTrack} from '../lib/physics/track-step.ts';
import type {Vector} from '../lib/physics/math.ts';
const [image,libraries,replay,game,car]=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game&&car);
const source=readFileSync(replay),bytes=Uint8Array.from(source),root=mkdtempSync(join(tmpdir(),'ms91-body-crossing-'));
assert.equal(bytes[26+13*30+10],4);bytes[26+13*30+10]=66;
const staged=join(root,'TUNNEL.RPL');writeFileSync(staged,bytes,{flag:'wx'});
const args=['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',staged,'--game',game,'--analyze','--car',car,'--position','690432',String(183*64),'884736'];
function run(extra:string[]){const r=spawnSync('python3',[...args,...extra],{encoding:'utf8',maxBuffer:4000000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
const initial=run([]),raw=Buffer.from(initial.carInitialized.raw,'hex');
for(let point=0;point<4;point++)raw.writeInt16LE(100,140+point*6+2);
const statePath=join(root,'CAR.BIN');writeFileSync(statePath,raw,{flag:'wx'});
for(const runtimeMode of [0,1]){
 const result=run(['--chassis-step','--car-state',statePath,'--runtime-mode',String(runtimeMode),'--branch-coverage']);
 const canonical=new Uint8Array(65536);canonical.set(raw.subarray(0,140),0x8c38);canonical.set(raw.subarray(164),0x8c38+140);
 const state=readPlayerDrivingState(canonical).driving.car;
 state.bodyPlaneCache=Array.from({length:4},(_,i)=>[0,1,2].map(a=>raw.readInt16LE(140+i*6+a*2)) as Vector);state.contactWheelAngles=[0,0,0,0];
 const tuning=Buffer.from(initial.carInitialized.tuning,'hex'),wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>tuning.readInt16LE(210+i*6+a*2)) as Vector);
 const track={raw:Array.from(bytes.subarray(26,1828)),objects:fixtureData.objects,planes:fixtureData.planes,walls:fixtureData.walls,physicsEngine:'ms-1991' as const,mode:0,runtimeMode,landmarks:{dimensions:[0,1,2].map(a=>tuning.readInt16LE(200+a*2)) as Vector,radius:tuning.readInt16LE(206),hillHeight:384}};
 const moved=moveTrack(state,wheels,track,state.engine,state.grip,0),expected=Buffer.from(result.chassis.after,'hex');
 assert.deepEqual(moved.pose.position,[0,4,8].map(o=>expected.readInt32LE(o)));
 assert.deepEqual(moved.pose.rotation,[24,26,28].map(o=>expected.readInt16LE(o)));
 assert.equal(moved.grip.crash,expected[201]);assert.equal(moved.grip.crash,runtimeMode===0?1:0);
 assert.deepEqual(moved.bodyPlaneCache,Array.from({length:4},(_,i)=>[0,1,2].map(a=>expected.readInt16LE(140+i*6+a*2))));
 const coverage=result.chassis.changedBranchCoverage;
 assert.ok(runtimeMode===0?coverage['0x89c3'].notTaken>0:coverage['0x89b0'].taken>0,'Targeted branch must execute');
 console.log(JSON.stringify({car,runtimeMode,crash:moved.grip.crash,crossing:coverage['0x89c3'],modeBypass:coverage['0x89b0'],pass:true,fullRaceVerified:false}));
}
assert.deepEqual(readFileSync(replay),source);
