import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,validateScoreSubmission} from '../lib/game/global-score-format.ts';
const root=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name+'.json',root),'utf8'));
const data={base:new Uint8Array(readFileSync(new URL('native-resource-base.bin',root))),catalog:createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(new URL('original-resources/'+file,root)))),cars:json('assets').cars,
 records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects:json('track-objects'),points:json('route-point-vectors'),indices:json('route-speed-indices'),planes:json('collision-planes'),walls:json('collision-walls').walls};
test('global verifier re-runs an original replay and rejects invented times and continuation',async()=>{
 const source=new Uint8Array(readFileSync(new URL('replays/CTKFIN.RPL',root))),replay=new Uint8Array(source.length+400);replay.set(source);replay.fill(1,source.length);
 const runtime=await createNativeManualRaceSession(data,{configuration:Array.from(replay.slice(0,24)),track:Array.from(replay.slice(24,0x722)),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 runtime.session.skipIntroduction();
 for(const input of replay.slice(0x722)){captureOriginalRaceInput(runtime.session.state.memory,0x2d1a0,input);runtime.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});}
 const {panel}=readOriginalRaceResultMemory(runtime.session.state.memory,0x2d1a0);
 const record=Array(52).fill(0);record[50]=panel.playerTime&255;record[51]=panel.playerTime>>>8;record[0]=84;
 let saved:Uint8Array|undefined;await runtime.session.saveReplay(async bytes=>{saved=bytes;return 0;});
 const submission={record,replay:Array.from(saved!),continued:false,flags:1,rules:GLOBAL_SCORE_RULES};
 assert.ok(panel.playerTime,'The original finish replay must finish');const verified=await verifyGlobalScore(submission,data);assert.equal(verified.ticks,panel.playerTime);
 assert.throws(()=>validateScoreSubmission({...submission,continued:true}),/continuation/);
 assert.throws(()=>validateScoreSubmission({...submission,flags:3}),/continuation/);
 const fake=[...record];fake[50]=1;fake[51]=0;await assert.rejects(verifyGlobalScore({...submission,record:fake},data));
 // The ordinary replay file retains only 12,000 frames. The online proof
 // retains the full input stream and must tolerate that original rollover.
 const long=new Uint8Array(0x722+12100);long.set(saved!);long.fill(0,saved!.length);new DataView(long.buffer).setUint16(22,12100,true);
 const longVerified=await verifyGlobalScore({...submission,replay:Array.from(long)},data);assert.equal(longVerified.ticks,panel.playerTime);
});
