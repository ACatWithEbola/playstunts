import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carContactResponse} from '../lib/physics/car-contact-response.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,1000);let differences=0;
for(const [index,row] of rows.entries()){
 for(const [engine,key] of [['ms-1990','legacy'],['ms-1991','modern']] as const)
  assert.deepEqual(carContactResponse(row.input[0],row.input[1],engine),row[key],engine+' contact case'+index);
 differences+=JSON.stringify(row.legacy)!==JSON.stringify(row.modern)?1:0;
}
assert.ok(differences>0);console.log('PASS1000 original paired car-contact cases; version differences='+differences);
