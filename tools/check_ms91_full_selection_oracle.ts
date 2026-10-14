import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {trackPlaneContact} from '../lib/physics/track.ts';
import {trackCollisionPoints} from '../lib/physics/track-collision-points.ts';
import type {Vector} from '../lib/physics/math.ts';
const [image,libraries,replay,game,catalog,terrainArg,modeArg]=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game);assert.ok(!catalog||catalog==='--catalog'||catalog==='--synthetic');
const mode=modeArg===undefined?0:Number(modeArg);assert.ok(Number.isInteger(mode)&&mode>=0&&mode<=255);
const terrain=terrainArg===undefined?0:Number(terrainArg);assert.ok(Number.isInteger(terrain)&&terrain>=0&&terrain<=18);
const before=readFileSync(replay);
const r=spawnSync('python3',['tools/check_original_ms91_track_allocation.py',image,'--libraries',libraries,'--replay',replay,'--game',game,...(catalog==='--synthetic'?[]:['--analyze']),catalog==='--catalog'?'--selection-catalog':'--selection-probes','--selection-terrain',String(terrain),'--selection-mode',String(mode)],{encoding:'utf8',maxBuffer:12000000});assert.equal(r.status,0,r.stderr);
const data=JSON.parse(r.stdout) as {selectionProbes:{point:Vector;previous:Vector;element:number|null;planeId:number;surface:number;wall:number;tileOrigin:Vector;wallLower:number;wallUpper:number;landmarkPoints?:Vector[];hillHeight:number}[]};
const raw=Array.from(before.subarray(26,1828));
assert.equal(data.selectionProbes.length,catalog==='--catalog'?10098:24300,'Oracle must execute every planned probe');
const unused=new Set<number>();let checked=0;
for(const row of data.selectionProbes){
 if(row.element!==null&&fixtureData.objects[row.element]?.physics===255){unused.add(row.element);continue;}
 if(row.element!==null){raw[15*30+15]=row.element;raw[901+14*30+15]=terrain;}
 let out:ReturnType<typeof trackPlaneContact>;
 try{out=trackPlaneContact(raw,fixtureData.objects,row.point.map(v=>v*64) as Vector,row.previous.map(v=>v*64) as Vector,mode,[0,0,0],'ms-1991');}
 catch(error){throw new Error(`Selector probe failed: ${JSON.stringify(row)}`,{cause:error});}
 assert.deepEqual([out.planeId,out.surface,out.wall],[row.planeId,row.surface,row.wall],JSON.stringify(row));
 assert.deepEqual(out.tileOrigin,row.tileOrigin,'Origin '+JSON.stringify(row));
 assert.deepEqual([out.wallLower,out.wallUpper],[row.wallLower,row.wallUpper],'Wall bounds '+JSON.stringify(row));
 if(row.landmarkPoints)assert.deepEqual(trackCollisionPoints(raw,fixtureData.objects,row.point[0]>>10,29-(row.point[2]>>10),row.hillHeight),row.landmarkPoints,'Landmark points '+JSON.stringify(row));
 checked++;
}
assert.deepEqual(readFileSync(replay),before);
console.log(JSON.stringify({terrain,mode,checked,unusedPhysics255Ids:[...unused],replayUnchanged:true,pass:true}));
