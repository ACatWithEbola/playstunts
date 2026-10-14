import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {slopeRoadMap} from '../lib/physics/slope-road-map.ts';
const [image,libraries]=process.argv.slice(2);
assert.ok(image&&libraries);
const result=spawnSync('python3',['tools/check_original_ms91_element_mapping.py',image,'--libraries',libraries],{encoding:'utf8'});
assert.equal(result.status,0,result.stderr);
const oracle=JSON.parse(result.stdout) as {checked:number;nonzero:Record<string,number>;pass:boolean};
assert.equal(oracle.checked,65536);assert.equal(oracle.pass,true);
for(let kind=0;kind<256;kind++)for(let element=0;element<256;element++){
 assert.equal(slopeRoadMap(kind,element),oracle.nonzero[`${kind}:${element}`]??0,`Original mapping mismatch ${kind}:${element}`);
}
console.log('Native slope mapping matches all 65536 original helper inputs');
