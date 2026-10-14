import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wallResponse,type WallResponseInput} from '../lib/physics/wall-response.ts';
const path=process.argv[2];assert(path,'Original capture path required');
const source=readFileSync(path),rows=JSON.parse(source.toString());assert.equal(rows.length,3000);
let contact=0;
for(const [index,row] of rows.entries()){
 const {expected,...input}=row;
 assert.deepEqual(wallResponse(input as WallResponseInput),expected,`Original legacy full wall response ${index}`);
 assert.deepEqual(wallResponse({...input,physicsEngine:'ms-1990'}),expected,`Explicit legacy response ${index}`);
 if(expected)contact++;
}
assert(contact>0);assert.deepEqual(readFileSync(path),source);
console.log(`All3000 captured original legacy wall cases match native full repositioning/retry result;${contact} contact responses; default and explicit legacy routes agree, source unchanged`);
