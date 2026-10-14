/** Isolated external completed-race verification. Never submits to a server. */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {importVersionedReplay,exportVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
const [path,time,version='bb-1991']=process.argv.slice(2);if(!path||!time)throw Error('Usage: node tools/test_external_bb11_score.ts REPLAY EXPECTED_TICKS [ENGINE]');
const engine=resolvePhysicsEngine(version);
const source=new Uint8Array(readFileSync(path)),snapshot=source.slice(),canonical=importVersionedReplay(source,engine),ticks=Number(time);
const record=Array(52).fill(0);record[0]=84;record[50]=ticks&255;record[51]=ticks>>8;
const verified=await verifyGlobalScore({record,replay:Array.from(canonical),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:engine},fixtureData);
assert.equal(verified.ticks,ticks);assert.equal(verified.physicsEngine,engine);
const output=exportVersionedReplay(verified.replay,engine);
assert.deepEqual(output.subarray(26,0x724),source.subarray(26,0x724));
assert.deepEqual(output.subarray(0x724),source.subarray(0x724,0x724+ticks));
assert.deepEqual(source,snapshot);
console.log(JSON.stringify({path,engine,ticks,verified:true,exportedFrames:output.length-0x724,storedSourceUnchanged:true}));
