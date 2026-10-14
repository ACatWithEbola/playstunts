import assert from 'node:assert/strict';
import {routePointResult} from '../lib/physics/route-point-result.ts';
import {trackRoutePoint,trackOpponentRoutePoint} from '../lib/physics/track-route-point.ts';
let cases=0,differences=0;
for(const a of [-32768,-32767,-3,-2,-1,0,1,2,3,32766,32767])for(const b of [-32768,-32767,-3,-2,-1,0,1,2,3,32766,32767]){
 const first=[a,a,a],second=[b,b,b],source=[...first,...second];
 const legacy=routePointResult(first,second,1,2,3,'ms-1990');
 assert.deepEqual(routePointResult(first,second,1,2,3),legacy);
 const modern=routePointResult(first,second,1,2,3,'ms-1991');
 for(let axis=0;axis<3;axis++){
  const sentinel=axis===1&&a===-1;
  assert.equal(legacy.midpoint[axis],sentinel?-1:Math.trunc((a+b)/2)||0);
  assert.equal(modern.midpoint[axis],sentinel?-1:(a+b)>>1);
 }
 assert.deepEqual([...first,...second],source);
 assert.equal(modern.last,1);assert.equal(modern.alternate,1);
 if(legacy.midpoint[0]!==modern.midpoint[0])differences++;
 cases++;
}
// A boundary tile makes the world endpoints -1 and0: prove routing reaches
// the actual coordinate pipeline, not only the isolated midpoint function.
const raw=Array(1802).fill(0),route={tiles:[0],directions:[0],columns:[0],routeRows:[29]};
const record=Array(14).fill(0);record[5]=1;
const records=[{records:[record]}],vectors=[{records:[{primary:[[-513,0,-513],[-512,0,-512]],alternate:null}]}],objects=[{multiTile:0}];
const legacy=trackRoutePoint(raw,route,0,0,records,vectors,objects,'ms-1990');
const modern=trackRoutePoint(raw,route,0,0,records,vectors,objects,'ms-1991');
assert.deepEqual(legacy.midpoint,[0,0,0]);assert.deepEqual(modern.midpoint,[-1,0,-1]);
assert.deepEqual(trackRoutePoint(raw,route,0,0,records,vectors,objects),legacy);
assert.deepEqual(trackOpponentRoutePoint(raw,route,0,0,records,vectors,objects,[0],[7],'ms-1991').midpoint,modern.midpoint);
console.log(JSON.stringify({cases,differences,pipelineRoutingVerified:true,legacyDefaultPreserved:true,sourceUnchanged:true,pass:true}));
