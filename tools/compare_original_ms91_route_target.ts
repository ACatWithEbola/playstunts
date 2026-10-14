import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {calculateRoutePoint} from '../lib/physics/route-point.ts';
const [image,libraries]=process.argv.slice(2);assert.ok(image&&libraries);
const run=spawnSync('python3',['tools/check_original_ms91_route_target.py',image,'--libraries',libraries],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
const capture=JSON.parse(run.stdout);assert.equal(capture.cases.length,128);assert.equal(capture.sourceUnchanged,true);
for(const row of capture.cases){
 const result=calculateRoutePoint({primary:[[-513,row.height,-513],[-512,row.height,-512],[-510,row.height,-510],[-509,row.height,-509]],alternate:row.alternate?[[-517,row.height,-517],[-516,row.height,-516],[-514,row.height,-514],[-513,row.height,-513]]:null,point:row.point,count:2,reverse:row.reverse,rotation:row.rotation,terrain:row.terrain,column:0,row:29,multiTile:0},'ms-1991');
 assert.deepEqual([...result.midpoint,...result.first,...result.second,result.alternate],row.output,JSON.stringify(row));
 assert.equal(result.last,row.last);
}
console.log(JSON.stringify({completeOriginalHelperCases:128,allCoordinatesAndFlagsMatch:true,sourceUnchanged:true,pass:true}));
