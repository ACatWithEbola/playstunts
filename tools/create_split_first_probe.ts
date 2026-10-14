/** Construct an isolated valid two-branch course, never a production asset. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fixtureData as d} from './global-score-fixture.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
const [base,output]=process.argv.slice(2);assert.ok(base&&output);
const source=readFileSync(base),cases=[],rejections:Record<string,number>={};let preparedCount=0;
const records=d.records as {records:number[][]}[];
const forks=records.map((r,i)=>({i,r})).filter(({i,r})=>r.records.length===2&&d.objects[i].multiTile===0).map(({i})=>i);
for(const split of forks)for(const merge of forks)for(let a=6;a<=9;a++)for(let b=6;b<=9;b++){
 const raw=Array.from(source);
 raw[13*30+10]=split;raw[11*30+10]=merge;
 raw[13*30+9]=5;raw[11*30+9]=5;raw[12*30+8]=4;
 raw[13*30+8]=a;raw[11*30+8]=b;
 try{
  const prepared=prepareRaceTrack(raw,d.records,d.vectors,d.samples,d.objects),r=prepared.route;
  preparedCount++;
  // Traversal links the two alternative fork records from the preceding
  // start node; the physical fork itself is the first element after it.
  if(r.columns[1]!==10||r.routeRows[1]!==16||(r.secondary[0]&65535)===65535)continue;
  const returnsToStart=(first:number)=>{const seen=new Set<number>();let at=first;while(at!==0){if(at<0||seen.has(at)||r.primary[at]===undefined)return false;seen.add(at);at=r.primary[at];}return true;};
  if(!returnsToStart(r.primary[0])||!returnsToStart(r.secondary[0]))continue;
  if(!r.tiles.includes(split)||!r.tiles.includes(merge))continue;
  cases.push({raw,split,merge,a,b,nodes:r.tiles.length,firstAlternate:r.secondary[0]});
 }catch(error){const reason=String(error);rejections[reason]=(rejections[reason]??0)+1;}
}
console.log(JSON.stringify({preparedCount,rejections}));
assert.ok(cases.length>0,'A valid two-branch first-element probe must exist');
const chosen=cases[0];writeFileSync(output,Uint8Array.from(chosen.raw),{flag:'wx'});
assert.deepEqual(readFileSync(base),source);
console.log(JSON.stringify({output,validArrangements:cases.length,...chosen,raw:undefined,gameplayVerified:false}));
