/** Read-only check of an actual browser-downloaded fresh MS91 race. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay,encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession,createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const [path,expectedText,cadenceText='20',backupKey,expectedOpponentText]=process.argv.slice(2);
assert.ok(path&&isAbsolute(path)&&expectedText,'Provide absolute download path and expected finish ticks');
const expected=Number(expectedText);assert.ok(Number.isSafeInteger(expected)&&expected>0);
const cadence=Number(cadenceText);assert.ok(cadence===10||cadence===20,'Expected cadence must be10 or20');
const source=readFileSync(path);
const backupFile=backupKey?JSON.parse(new TextDecoder().decode(source)).files.find((file:{key:string})=>file.key===backupKey):null;
if(backupKey){assert.ok(backupFile,'Requested replay must exist in exported backup');assert.equal(backupFile.physicsEngine,'ms-1991');assert.equal(backupFile.framesPerSecond??20,cadence);}
const stored=backupKey?Buffer.from(backupFile.bytes,'base64'):source;
const original=backupKey?encodeVersionedReplay(stored,'ms-1991',cadence):stored,decoded=decodeVersionedReplay(original,'ms-1991');
if(backupKey)assert.deepEqual(decoded.bytes,new Uint8Array(stored));
const tablesBefore=JSON.stringify({records:fixtureData.records,points:fixtureData.points});
assert.equal(decoded.framesPerSecond,cadence);
assert.deepEqual(encodeVersionedReplay(decoded.bytes,'ms-1991',cadence),new Uint8Array(original));
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:cadence,experimental10Hz:cadence===10},{configuration:Array.from(decoded.bytes.slice(0,24)),track:Array.from(decoded.bytes.slice(24,0x722)),name:'QA_LOOP',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
for(const input of decoded.bytes.slice(0x722)){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input,cadence,'ms-1991');
 race.session.originalMemory.writeMemory(race.session.state.memory);
 race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
}
const panel=readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel;
if(expectedOpponentText!==undefined){
 const opponent=Number(expectedOpponentText);assert.ok(Number.isSafeInteger(opponent)&&opponent>=0);
 assert.equal(panel.opponentTime,opponent,'Recorded opponent result must match the browser result');
}
assert.equal(panel.playerTime,expected);
const record=Array(52).fill(0);record[0]=83;record[50]=expected&255;record[51]=expected>>>8;
const submission={record,replay:Array.from(decoded.bytes),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:'ms-1991',framesPerSecond:cadence};
let routeClassification:{routeAssessment:string;assessmentReason:string}|undefined;
if(cadence===20){
 const verified=await verifyGlobalScore(submission,fixtureData);
 assert.equal(verified.ticks,expected);assert.equal(verified.physicsEngine,'ms-1991');
 routeClassification={routeAssessment:verified.routeAssessment,assessmentReason:verified.assessmentReason};
}else{
 // Approved policy:10Hz recordings remain private, never public scores.
 await assert.rejects(()=>verifyGlobalScore(submission,fixtureData),/Only 20 Hz score submissions/);
}
const replayRace=await createNativeReplayRaceSession({...fixtureData,physicsEngine:'ms-1990',experimental10Hz:cadence===10},
 {configuration:Array.from(decoded.bytes.slice(0,24)),track:Array.from(decoded.bytes.slice(24,0x722)),name:'QA_LOOP',camera:0,graphics:2,soundEnabled:false},
 {bytes:decoded.bytes,name:'QA_LOOP',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:cadence},
 {resetMouse(){},async key(){return 0;}});
assert.equal(replayRace.session.physicsEngine,'ms-1991');
// Loaded recordings carry flag4. Original finish/crash preserves the earlier
// evaluation snapshot rather than deriving fresh result rows from playback.
// Car-state equality alone must not be presented as fresh result-screen proof.
const loadedPanel=readOriginalRaceResultMemory(replayRace.session.state.memory,0x2d1a0).panel;
replayRace.session.seek(0);replayRace.session.seek(replayRace.session.length);
assert.deepEqual(readRecordedTwoCarRace(replayRace.session.state.memory,0x2d1a0).player.driving.car,
 readRecordedTwoCarRace(race.session.state.memory,0x2d1a0).player.driving.car);
assert.equal(readOriginalRaceResultMemory(replayRace.session.state.memory,0x2d1a0).panel.flags,4);
assert.deepEqual(readOriginalRaceResultMemory(replayRace.session.state.memory,0x2d1a0).panel,loadedPanel,'Loaded replay retains evaluation snapshot');
// Exercise checkpoint rewind as well as loading the endpoint.
replayRace.session.seek(Math.floor(replayRace.session.length/2));
replayRace.session.seek(0);replayRace.session.seek(replayRace.session.length);
assert.deepEqual(readRecordedTwoCarRace(replayRace.session.state.memory,0x2d1a0).player.driving.car,
 readRecordedTwoCarRace(race.session.state.memory,0x2d1a0).player.driving.car);
assert.deepEqual(readOriginalRaceResultMemory(replayRace.session.state.memory,0x2d1a0).panel,loadedPanel,'Rewind retains evaluation snapshot');
assert.equal(JSON.stringify({records:fixtureData.records,points:fixtureData.points}),tablesBefore);
assert.deepEqual(readFileSync(path),source);
console.log(JSON.stringify({path,engine:'ms-1991',framesPerSecond:cadence,finishTicks:expected,...routeClassification,publicScoreVerified:cadence===20,privateCadenceGateVerified:cadence===10,downloadBytes:original.length,storedReplayUnchanged:true,legacyDefaultRouting:true,replayIneligible:true,checkpointRewind:true}));
