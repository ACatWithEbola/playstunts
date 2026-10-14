import assert from 'node:assert/strict';
import {releaseInstrumentationFindings,builtInstrumentationFindings} from './check_release_test_instrumentation.mjs';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
assert.deepEqual(releaseInstrumentationFindings([{path:'app/clean.tsx',source:'createNativeMusic(context,engine)'}]),[]);
for(const marker of ['dataset.raceFrame','dataset.raceClock','raceClockBlocked','raceAudioState','raceAudioTime'])assert.deepEqual(releaseInstrumentationFindings([{path:'app/debug.tsx',source:marker}]),[`app/debug.tsx: ${marker}`]);
for(const marker of ['preview-audio','preview-mt32','preview-tandy','browserTestAudioMuted','silentAudioOutputContext','testAudioOutput','testMusicScore','testMusicFrames','testMusicNonzero','testMusicPeak','testMusicClock','qaMusicBuffer','qa-driving','qaDriving','local-driving-telemetry']){
 assert.deepEqual(releaseInstrumentationFindings([{path:'app/test.tsx',source:marker}]),[`app/test.tsx: ${marker}`]);
}
console.log('Release guard rejects each temporary audio/driving diagnostic marker and accepts clean source');
for(const marker of ['testRaceAudioMaxGapSeconds','testRaceAudioBuffers','testRaceAudioMaxGapDetail'])assert.deepEqual(releaseInstrumentationFindings([{path:'app/test.tsx',source:marker}]),[`app/test.tsx: ${marker}`]);
assert.deepEqual(releaseInstrumentationFindings([{path:'app/test.tsx',source:'testRaceFrameWaitDetail'}]),['app/test.tsx: testRaceFrameWaitDetail']);
for(const marker of ['testMusicTransitionBefore','testMusicTransitionAfter'])assert.deepEqual(releaseInstrumentationFindings([{path:'app/test.tsx',source:marker}]),[`app/test.tsx: ${marker}`]);
assert.deepEqual(releaseInstrumentationFindings([{path:'app/test.tsx',source:'testNativeFileAliases'}]),['app/test.tsx: testNativeFileAliases']);
const fixture=mkdtempSync(join(tmpdir(),'playstunts-built-guard-'));
assert.throws(()=>builtInstrumentationFindings(fixture),/No compiled JavaScript/);
mkdirSync(join(fixture,'chunks'));writeFileSync(join(fixture,'chunks','test.js'),'const query="preview-suno-score";');
assert.deepEqual(builtInstrumentationFindings(fixture),{files:1,findings:['chunks/test.js: preview-suno-score']});
writeFileSync(join(fixture,'chunks','test.js'),'const mode="normal";');
assert.deepEqual(builtInstrumentationFindings(fixture),{files:1,findings:[]});
