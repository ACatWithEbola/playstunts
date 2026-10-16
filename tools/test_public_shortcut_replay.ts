/** Read-only regression of an external downloaded public replay. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
const [path,ticksText,expected='shortcuts_detected',engine='ms-1991']=process.argv.slice(2);
assert.ok(path&&ticksText,'Provide external RPL path and original finish ticks');
const ticks=Number(ticksText),source=readFileSync(path),decoded=decodeVersionedReplay(source,engine as never);
const record=Array(52).fill(0);record[0]=84;record[50]=ticks&255;record[51]=ticks>>>8;
const before=Buffer.from(source),result=await verifyGlobalScore({record,replay:Array.from(decoded.bytes),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:engine,framesPerSecond:20},fixtureData);
assert.equal(result.ticks,ticks);assert.equal(result.routeAssessment,expected);assert.deepEqual(readFileSync(path),before);
console.log(JSON.stringify({path,ticks,seconds:ticks/20,routeAssessment:result.routeAssessment,reason:result.assessmentReason,physicsEngine:result.physicsEngine,version:ROUTE_ASSESSMENT_VERSION,downloadSha256:createHash('sha256').update(source).digest('hex'),readOnly:true}));
