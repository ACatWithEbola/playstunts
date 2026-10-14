import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {originalModelTracksRegion} from '../lib/game/model-region-tracking.ts';
import {originalPolygonVisibility} from '../lib/game/polygon-visibility.ts';
import {projectOriginalCircle} from '../lib/game/project-original-circle.ts';
import {clipOriginalLine} from '../lib/game/clip-original-line.ts';
import {i16} from '../lib/physics/math.ts';
const [image,libraries]=process.argv.slice(2);if(!image||!libraries)throw Error('Provide original MS91 image and emulator libraries');
const execution=spawnSync('python3',['tools/check_original_ms91_primitive_regions.py',image,libraries],{encoding:'utf8',maxBuffer:2*1024*1024});assert.equal(execution.status,0,execution.stderr);
const rows=JSON.parse(execution.stdout);assert.equal(rows.length,1024);
for(const row of rows){
 let actual=row.before;
 if(originalModelTracksRegion(row.flags,true)){
  if(row.kind==='circle')actual=projectOriginalCircle([[0,0,1000],[row.radius,0,1000]],row.points[0],[0,0],1000,row.before).rectangle;
  else if(row.kind==='line')actual=clipOriginalLine([0,1],[[0,0,100],[0,0,100]],[row.points[0],row.points[3]],[0,0],[0,0],[0,0],row.before).rectangle;
  else if(row.kind==='wheel'){
   const points=[row.points[0],row.points[3]].flatMap((center:number[])=>[-1,1].map(sign=>center.map(n=>i16(n+sign*(row.radius+1)))));
   actual=originalPolygonVisibility(points,0,1,0,0,row.before).rectangle;
  }else actual=originalPolygonVisibility([row.points[0]],0,1,0,0,row.before).rectangle;
 }
 assert.deepEqual(actual,row.after,`Original ${row.kind} bounds for flags${row.flags}`);
}
console.log('MS91 line/circle/wheel/point bounds-write branches match1024 original executable cases, with descriptor08 enabled/disabled and bounded persistent writes');
