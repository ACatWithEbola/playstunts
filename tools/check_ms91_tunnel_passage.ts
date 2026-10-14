/** Continuous original chassis passage; no race controls, score or stored edits. */
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
const source=readFileSync(replay),bytes=Uint8Array.from(source),root=mkdtempSync(join(tmpdir(),'ms91-tunnel-passage-'));
assert.equal(bytes[26+13*30+10],4);bytes[26+13*30+10]=66;
const staged=join(root,'TUNNEL.RPL');writeFileSync(staged,bytes,{flag:'wx'});
const args=['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',staged,'--game',game,'--analyze','--car',car,'--position','690432','0','843776'];
function run(extra:string[]){const r=spawnSync('python3',[...args,...extra],{encoding:'utf8',maxBuffer:4000000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
const initial=run([]),raw=Buffer.from(initial.carInitialized.raw,'hex');
for(const offset of [42,44,46])raw.writeUInt16LE(32768,offset);
const statePath=join(root,'CAR.BIN');writeFileSync(statePath,raw,{flag:'wx'});
const result=run(['--chassis-step','--chassis-steps','40','--car-state',statePath]);
const canonical=new Uint8Array(65536);canonical.set(raw.subarray(0,140),0x8c38);canonical.set(raw.subarray(164),0x8c38+140);
let state=readPlayerDrivingState(canonical).driving.car;
state.bodyPlaneCache=Array.from({length:4},(_,i)=>[0,1,2].map(a=>raw.readInt16LE(140+i*6+a*2)) as Vector);
state.contactWheelAngles=[0,0,0,0];
const tuning=Buffer.from(initial.carInitialized.tuning,'hex');
const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>tuning.readInt16LE(210+i*6+a*2)) as Vector);
const track={raw:Array.from(bytes.subarray(26,1828)),objects:fixtureData.objects,planes:fixtureData.planes,walls:fixtureData.walls,physicsEngine:'ms-1991' as const,mode:0,runtimeMode:0,landmarks:{dimensions:[0,1,2].map(a=>tuning.readInt16LE(200+a*2)) as Vector,radius:tuning.readInt16LE(206),hillHeight:384}};
const rows=new Set<number>([state.pose.position[2]>>>16]);
for(const [frame,hex] of result.chassis.sequence.entries()){
 const expected=Buffer.from(hex as string,'hex');
 const moved=moveTrack(state,wheels,track,state.engine,state.grip,state.engine.roadSpeed);
 assert.deepEqual(moved.pose.position,[0,4,8].map(o=>expected.readInt32LE(o)),'position frame'+frame);
 assert.deepEqual(moved.pose.rotation,[24,26,28].map(o=>expected.readInt16LE(o)),'rotation frame'+frame);
 assert.equal(moved.grip.crash,expected[201],'crash frame'+frame);
 assert.equal(moved.grip.crash,0,'Passage must remain crash-free');
 assert.deepEqual(moved.bodyPlaneCache,Array.from({length:4},(_,i)=>[0,1,2].map(a=>expected.readInt16LE(140+i*6+a*2))),'cache frame'+frame);
 state={...moved,contactWheelAngles:[0,0,0,0]};rows.add(state.pose.position[2]>>>16);
}
assert.ok(rows.has(12)&&rows.has(13)&&rows.has(14),'Must cross entrance and exit, observed rows '+[...rows]);
assert.deepEqual(readFileSync(replay),source);
console.log(JSON.stringify({car,frames:40,rows:[...rows],continuousPassage:true,sourceUnchanged:true,pass:true}));
