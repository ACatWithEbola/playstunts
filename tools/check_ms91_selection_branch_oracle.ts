import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {tunnelSelection} from '../lib/physics/tunnel-selection.ts';
import {dividedRoadSelection} from '../lib/physics/divided-road-selection.ts';
import type {Vector} from '../lib/physics/math.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
let checked=0;
for(const divider of [false,true]){
 const r=spawnSync('python3',['tools/compare_original_tunnel_selection.py',legacy,modern,'--libraries',libraries,'--json',...(divider?['--divider','--divider-sweep']:[])],{encoding:'utf8',maxBuffer:12000000});
 assert.equal(r.status,0,r.stderr);
 const rows=JSON.parse(r.stdout) as {point:Vector;previous:Vector;result:number[]}[];
 for(const row of rows){
  const result=(divider?dividedRoadSelection:tunnelSelection)(row.point,row.previous,1);
  assert.deepEqual([result.surface,result.planeGroup,result.wall,result.wallUpper],row.result,`${divider?'Divider':'Tunnel'} ${JSON.stringify(row.point)} previous ${JSON.stringify(row.previous)}`);
  checked++;
 }
}
console.log(`Native tunnel/divider selection matches ${checked} paired original boundary/random cases`);
