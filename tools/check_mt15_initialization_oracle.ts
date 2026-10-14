import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeOriginalMt32} from '../lib/game/mt32-system-exclusive.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,2);
for(const row of rows){
 const driver=versionedMt15Resource(row.engine)??readFileSync('public/game/original-resources/MT15.DRV');
 const program=initializeOriginalMt32(driver,row.engine),writes:number[][]=[];let step=program.next();
 while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}
 assert.equal(step.value,row.result);assert.deepEqual(writes,row.writes,row.engine);
}
console.log('Both original Roland initialization return values and complete virtual port traces match; elapsed host timing not covered');
