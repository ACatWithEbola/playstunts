/** New local-only course for keyboard-driven browser QA; never overwrites assets. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {isAbsolute,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureData} from './global-score-fixture.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
function permutations(values:number[]):number[][]{return values.length?values.flatMap((value,index)=>permutations(values.filter((_,i)=>i!==index)).map(tail=>[value,...tail])):[[]];}
export function createBrowserFinishCourse(){
const valid:{raw:number[];corners:number[];nodes:number}[]=[];
for(const corners of permutations([6,7,8,9])){
 const raw=Array(1802).fill(0);
 for(let row=11;row<14;row++){raw[row*30+10]=4;raw[row*30+14]=4;}
 for(let column=11;column<14;column++){raw[10*30+column]=5;raw[14*30+column]=5;}
 raw[12*30+10]=1;
 for(const [index,cell] of [10*30+10,10*30+14,14*30+10,14*30+14].entries())raw[cell]=corners[index];
 try{
  const prepared=prepareRaceTrack(raw,fixtureData.records,fixtureData.vectors,fixtureData.samples,fixtureData.objects);
  valid.push({raw,corners,nodes:prepared.route.tiles.length});
 }catch{/* An invalid corner permutation is not selected. */}
}
assert.equal(valid.length,1,'Course must have one unambiguous valid corner arrangement');
const course=valid[0];
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const data=versionedRouteTables({...fixtureData,physicsEngine});
 const prepared=prepareRaceTrack(course.raw,data.records,data.vectors,data.samples,data.objects);
 assert.equal(prepared.route.tiles.length,course.nodes);
}
return course;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const destination=process.argv[2];assert.ok(destination&&isAbsolute(destination),'Provide a new absolute .TRK path');assert.match(destination,/\.TRK$/i);
 const course=createBrowserFinishCourse();writeFileSync(destination,Uint8Array.from(course.raw),{flag:'wx'});
 console.log(JSON.stringify({destination,corners:course.corners,nodes:course.nodes,bytes:1802,engines:['ms-1990','ms-1991'],productionAssetsChanged:false}));
}
