/** Bounded direct original chassis corpus, not full race verification. */
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
const [image,libraries,replay,game,cars,mode]=process.argv.slice(2);
assert.ok(mode===undefined||mode==='--combined');
assert.ok([image,libraries,replay,game,cars].every(x=>x&&isAbsolute(x)));
const entries=readdirSync(cars).filter(name=>/^CAR[A-Z0-9]{4}\.RES$/.test(name)).sort();assert.equal(entries.length,11);
let cases=0;
for(const name of entries){
 const path=join(cars,name),before=readFileSync(path);
 const states:string[][]=mode==='--combined'?[['0','0','0','0','0','1'],['10000','0','0','0','0','5'],['30000','0','0','0','0','10']]:[['0','0','0'],['30000','-81','64']];
 for(const state of states){
  const run=spawnSync(process.execPath,[new URL('./check_ms91_stationary_chassis.ts',import.meta.url).pathname,image,libraries,replay,game,path,...state],{encoding:'utf8'});
  assert.equal(run.status,0,name+' '+state.join('/')+'\n'+run.stderr+'\n'+run.stdout);
  assert.deepEqual(readFileSync(path),before);cases++;
 }
 console.log(name+' direct MS91 '+(mode==='--combined'?'combined driving':'contact')+' checks pass');
}
assert.equal(cases,mode==='--combined'?33:22);console.log(JSON.stringify({originalMS91:true,cars:11,cases,combinedStage:mode==='--combined',fullRaceVerified:false,pass:true}));
