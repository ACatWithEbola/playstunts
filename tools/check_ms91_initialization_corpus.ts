import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
const [image,libraries,replay,game,cars]=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game&&cars);
const ids=readdirSync(cars).filter(name=>/^CAR[A-Z0-9]{4}\.RES$/.test(name)).map(name=>name.slice(3,7)).sort();assert.equal(ids.length,11);
for(const car of ids){
 const run=spawnSync(process.execPath,['--import','tsx','tools/check_ms91_initialization_capture.ts',image,libraries,replay,game,cars,car],{encoding:'utf8'});
 assert.equal(run.status,0,car+'\n'+run.stderr);const result=JSON.parse(run.stdout.trim());assert.equal(result.initialBytesCompared,1120);assert.equal(result.car,car);assert.equal(result.pass,true);
 console.log(JSON.stringify(result));
}
console.log(JSON.stringify({cars:11,bytesCompared:12320,completeInitialSnapshotsMatch:true,pass:true}));
