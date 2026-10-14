/** Generate a separate local test artifact, never replace a user's recording. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeVersionedReplay,encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const [input,output,opponentText='1']=process.argv.slice(2),opponent=Number(opponentText);
if(!Number.isInteger(opponent)||opponent<1||opponent>6)throw Error('Probe opponent must be1..6');
if(!input||!output||!isAbsolute(output)||resolve(input)===resolve(output))throw Error('Pass reference input and a different absolute NEW output path');
const source=new Uint8Array(readFileSync(input)),before=source.slice();
const decoded=decodeVersionedReplay(source,'ms-1991'),probe=decoded.bytes.slice();
probe[6]=opponent;probe.set(probe.slice(0,4),7);probe[11]=probe[4];probe[12]=1;
writeFileSync(output,encodeVersionedReplay(probe,'ms-1991',decoded.framesPerSecond),{flag:'wx'});
assert.deepEqual(new Uint8Array(readFileSync(input)),before);
console.log(JSON.stringify({output,synthetic:true,opponent,rate:decoded.framesPerSecond,sourceSha256:createHash('sha256').update(source).digest('hex')}));
