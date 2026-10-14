import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {ms91GameTime} from '../lib/game/game-time-format.ts';
import {writeMs91ResultTimeFields} from '../lib/game/race-result-time-scratch.ts';
const path=process.argv[2];if(!path)throw Error('Supply original formatter capture');
const rows=JSON.parse(readFileSync(path,'utf8')) as {rate:10|20;ticks:number;fractions:boolean;text:string;resultFrameBP?:number;retained?:{delta:number;value:number}[]}[];
assert.equal(rows.length,4052);
for(const row of rows)assert.equal(ms91GameTime(row.ticks,row.fractions,row.rate),row.text,JSON.stringify(row));
let fields=0;
for(const row of rows)if(row.retained?.length){
 const memory=new Uint8Array(65536).fill(71),before=memory.slice(),bp=row.resultFrameBP!,view=new DataView(memory.buffer);
 writeMs91ResultTimeFields(memory,0,bp,row.ticks,row.rate);
 const allowed=new Set<number>();
 for(const field of row.retained){const at=(bp+field.delta)&65535;assert.equal(view.getUint16(at,true),field.value);allowed.add(at);allowed.add(at+1);fields++;}
 for(let i=0;i<memory.length;i++)if(!allowed.has(i))assert.equal(memory[i],before[i]);
}
console.log(`TypeScript time text matches all${rows.length} complete originalMS91 formatter captures`);
console.log(`Retained field writer matches${fields} original words without unrelated writes`);
