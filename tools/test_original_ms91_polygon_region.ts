import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {originalModelTracksRegion} from '../lib/game/model-region-tracking.ts';
import {originalPolygonVisibility} from '../lib/game/polygon-visibility.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original MS91 image and emulator libraries');
const execution=spawnSync('python3',['tools/check_original_ms91_polygon_region.py',image,libraries],{encoding:'utf8',maxBuffer:2*1024*1024});assert.equal(execution.status,0,execution.stderr);
const rows=JSON.parse(execution.stdout);assert.equal(rows.length,256);
for(const row of rows){
 const actual=originalModelTracksRegion(row.flags,true)?originalPolygonVisibility(row.points,0,1,0,0,row.before).rectangle:row.before;
 assert.deepEqual(actual,row.after,'Original MS91 polygon bounds writes for descriptor flags '+row.flags);
 assert.equal(originalModelTracksRegion(row.flags),true,'Default legacy policy remains unconditional');
}
console.log('MS91 polygon-region writes match original executable across all256 descriptor flags, including signed extremes and unchanged untracked bounds');
