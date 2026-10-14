import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requestMs91TandySampleStop,startMs91TandySample} from '../lib/game/ms91-tandy-sample-start.ts';
import {stepMs91TandySampleIrq} from '../lib/game/ms91-tandy-sample-irq.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
const delays=[...new Set(rows.map((row:{delay:number})=>row.delay))];assert.ok(delays.length>=3);
assert.equal(rows.length,delays.length*2);
for(const delay of delays)for(const differential of [false,true])assert.equal(rows.filter((row:{delay:number;differential:boolean})=>row.delay===delay&&row.differential===differential).length,1,'Each delay covers both IRQ formats exactly once');
for(const row of rows){
 if(row.waitFlags){assert.ok(row.waitFlags.some((flags:number)=>(flags&512)===0),'Capture includes pre-STI boundary');assert.ok(row.waitFlags.at(-1)&512,'IRQ may only be delivered with IF enabled');}
 const memory=new Uint8Array(0x100000),before=Uint8Array.from(Buffer.from(row.before,'base64'));
 memory.set(before,0x20000);memory.set(row.vectorBefore,0x20);memory.set([128,55,134,217,44,128,128],0x30100);
 assert.equal(requestMs91TandySampleStop(memory,0x2000),false);assert.equal(memory[0x20595],255);
 assert.deepEqual(memory.slice(0x20000,0x20000+before.length),Uint8Array.from(Buffer.from(row.pending,'base64')),'Pending native wait state matches without clearing busy');
 const irq=stepMs91TandySampleIrq(memory,0x2000,row.differential);
 const writes=irq.writes.slice();
 if(row.chain){assert.equal(irq.returnKind,'chain');writes.push([0x80,0x5a]);}
 if(row.replacement){memory.set(row.sample,0x30200);const started=startMs91TandySample(memory,0x2000,row.request);assert.equal(started.started,true);writes.push(...started.writes);}
 assert.deepEqual(memory.slice(0x20000,0x20000+before.length),Uint8Array.from(Buffer.from(row.after,'base64')));
 assert.deepEqual([...memory.slice(0x20,0x24)],row.vectorAfter);assert.deepEqual(writes,row.writes);
}
console.log(`${rows.length} original busy-stop/native-IRQ cases match full helper state, vector restoration and ordered ports; explicit delivery, not browser CPU timing`);
