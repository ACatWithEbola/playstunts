import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {rasterOriginalCircle} from '../lib/game/raster-original-circle.ts';
import type {PhysicsEngineVersion} from '../lib/physics/engine-version.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
const result=spawnSync('python3',['tools/check_original_circle_pixels.py',legacy,modern,'--libraries',libraries],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
const oracle=JSON.parse(result.stdout);assert.equal(oracle.originalCases,32);assert.equal(oracle.sourceUnchanged,true);
const memory=new Uint8Array(65536);memory.set(oracle.legacyCircleBank,0x3bc8);const before=memory.slice();
for(const row of oracle.rows){
 const pixels=new Uint8Array(64000);
 rasterOriginalCircle(memory,0,row.x,row.y,row.diameter,7,[0,320,0,200],(x,y,count,colour)=>pixels.fill(colour,y*320+x,y*320+x+count),row.engine as PhysicsEngineVersion);
 assert.equal(createHash('sha256').update(pixels).digest('hex'),row.sha256,`${row.engine} ${row.x}/${row.y} diameter${row.diameter}`);assert.deepEqual(memory,before);
}
console.log(JSON.stringify({originalPixelCases:32,engines:2,smallLargeAndClippedCircles:true,sourceUnchanged:true}));
