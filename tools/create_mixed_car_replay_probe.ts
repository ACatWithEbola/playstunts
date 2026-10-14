/** Exclusive isolated test copy; never modifies a source recording. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
const [source,target,opponent]=process.argv.slice(2);
assert.ok(isAbsolute(source)&&isAbsolute(target)&&source!==target&&/^[A-Z0-9]{4}$/.test(opponent));
const bytes=readFileSync(source),before=Buffer.from(bytes),probe=Buffer.from(bytes);
assert.equal(probe.length,0x724+probe.readUInt16LE(24),'Original MS91 header required');
assert.ok(probe[6]>=1&&probe[6]<=6,'Existing opponent profile required');
probe.set(Buffer.from(opponent,'ascii'),7);
writeFileSync(target,probe,{flag:'wx'});
assert.deepEqual(readFileSync(source),before);
assert.deepEqual(probe.subarray(26),before.subarray(26),'Track and recorded controls unchanged');
console.log(JSON.stringify({sourceUnchanged:true,syntheticProbe:true,player:probe.subarray(0,4).toString(),opponent,frames:probe.readUInt16LE(24)}));
