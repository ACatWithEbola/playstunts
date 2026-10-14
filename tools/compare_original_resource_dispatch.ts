import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dispatchNativeResourceLoad} from '../lib/game/native-resource-dispatch.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,18);
const loaderIds=[0,0,2,3,4,5,6,1,7];
for(const row of rows){
 const memory=new Uint8Array(65536),events:unknown[]=[],pointer={offset:0x1000,segment:0x9000};
 const result=await dispatchNativeResourceLoad({memory:()=>memory,async load(kind,name){assert.equal(name,0x2000);events.push(['loader',loaderIds[kind]]);return row.success?pointer:null;},async retry(){events.push(['retry']);return 2;}},0,row.kind,0x2000,0xf000);
 assert.deepEqual(events,row.events,`kind ${row.kind} success ${row.success}`);
 assert.deepEqual(result,row.success?pointer:null);
}
console.log('PASS: all 18 resource dispatcher scenarios match captures verified in both original editions');
