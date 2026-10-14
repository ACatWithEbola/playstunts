import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';
import {preloadRemixedMusicFiles,decodeRemixedMusic,remixedMusicTiming} from '../lib/game/remixed-music.ts';
import {releaseInstrumentationFindings} from './check_release_test_instrumentation.mjs';
const location={hostname:'localhost',search:'?preview-suno-score=1'};
for(const generation of ['ms-1990','bb-1991','unknown'])assert.equal(browserMs91SunoScorePreview(generation,location),undefined);
for(const hostname of ['playstunts.com','localhost.evil','192.168.1.20'])assert.equal(browserMs91SunoScorePreview('ms-1991',{...location,hostname}),undefined);
for(const search of ['', '?preview-suno-score=0','?preview-suno-score=1&preview-suno-score=1'])assert.equal(browserMs91SunoScorePreview('ms-1991',{...location,search}),undefined);
assert.equal(browserMs91SunoScorePreview('ms-1991'),undefined);
const preview=browserMs91SunoScorePreview('ms-1991',location);assert.ok(preview);
assert.equal(preview.timing.over.loopDuration,30.47046875);assert.equal(preview.timing.over.introDuration,30.51853125);
for(const [score,path] of Object.entries(preview.paths)){
 assert.match(path,score==='titl'?/ms91-suno-title-loop-20261014-44\/loop-seam-trial\.wav$/:/ms91-remix-reproducible-20261013-19\/(slct|vict|over)-three-cycle\.wav$/,'Use only timing-edited actual Suno recordings');
 assert.doesNotMatch(path,/arrangement|harmonic|zoned|macro-seam/,'No reconstructed replacements');
}
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const titleSeam=JSON.parse(readFileSync('/private/tmp/ms91-suno-title-loop-20261014-44/manifest.json'));
assert.equal(titleSeam.source,'/private/tmp/ms91-remix-reproducible-20261013-19/titl-three-cycle.wav');
assert.equal(digest(titleSeam.source),titleSeam.sourceSha256);
assert.equal(digest('/private/tmp/ms91-suno-title-loop-20261014-44/loop-seam-trial.wav'),titleSeam.outputSha256);
assert.equal(titleSeam.durationChanged,false);assert.equal(titleSeam.fadeFrames,192);
const recipe=JSON.parse(readFileSync('/private/tmp/ms91-remix-reproducible-20261013-19/manifest.json'));
const sourceNames={titl:'01 - Opening and Title - Suno.wav',slct:'02 - Menu and Selection - Suno.wav',vict:'03 - Victory - Suno.wav',over:'04 - Game Over - Suno.wav'};
for(const [score,name] of Object.entries(sourceNames))assert.equal(digest(recipe.sourceRoot+'/'+name),recipe.sourceHashes[score],'Actual Suno source unchanged');
assert.equal(remixedMusicTiming.slct.cueOffset,.85,'Legacy timing must remain unchanged');
assert.equal(releaseInstrumentationFindings([{path:'trial.ts',source:'preview-suno-score'}]).length,1,'QA hook must block production release');
// Wiring checks supplement (not replace) native-browser playback verification.
const opening=readFileSync(new URL('../app/OpeningSequence.tsx',import.meta.url),'utf8');
assert.doesNotMatch(opening,/remixPreview|preview-suno-score|browserMs91SunoScorePreview/,'Research override must not enter shipped game');
assert.match(opening,/const remixFiles=ms91SunoMusic\(selectBrowserFutureRaceEngine\(\)\)/,'Normal edition selects packaged audio');
assert.match(opening,/createSynchronizedRemixedMusic\(runAudio,originalMusic,\{\},audioUpdateState.enabled,remixFiles\?\.timing/,'Packaged timing affects only Updated wrapper');
assert.match(opening,/void remixedTitlePromise.then\(\(\)=>decodeRemixedMusic/,'Normal background preload remains');
assert.match(opening,/for\(const score of \['slct','vict','over'\] as const\)void remixedTitlePromise.then\(\(\)=>decodeRemixedMusic\(runAudio,\[score\],remixFiles\?\.paths\)\)/,'Slow lossless result loading must not delay other songs');
assert.match(opening,/run\(\).catch\(async e=>\{demoAbort.abort\(\)/,'A failed run must cancel outstanding owned transfers');
const originalFetch=globalThis.fetch,calls=[],attempts=new Map();
try{
 globalThis.fetch=async path=>{calls.push(path);const count=(attempts.get(path)??0)+1;attempts.set(path,count);return {ok:!(path.includes('/offline/')&&count===1),arrayBuffer:async()=>Uint8Array.of(calls.indexOf(path)+1).buffer};};
 const legacy=await preloadRemixedMusicFiles(['titl']);
 const trial=await preloadRemixedMusicFiles(['titl'],preview.paths);
 assert.notEqual(new Uint8Array(legacy.titl)[0],new Uint8Array(trial.titl)[0],'Candidate cannot reuse legacy encoded bytes');
 await Promise.all([preloadRemixedMusicFiles(['titl']),preloadRemixedMusicFiles(['titl'],preview.paths)]);
 assert.equal(calls.length,2,'Each distinct URL transfers once');
 await decodeRemixedMusic({async decodeAudioData(bytes){new Uint8Array(bytes)[0]=255;return {duration:1};}},['titl'],preview.paths);
 assert.notEqual(new Uint8Array((await preloadRemixedMusicFiles(['titl'],preview.paths)).titl)[0],255,'Decoder receives a copy');
 const failed={...preview.paths,vict:'http://127.0.0.1:5192/offline/vict.wav'};
 await assert.rejects(preloadRemixedMusicFiles(['vict'],failed));await preloadRemixedMusicFiles(['vict'],failed);
 assert.equal(attempts.get(failed.vict),2,'Failed URL must be retryable');
 await assert.rejects(preloadRemixedMusicFiles(['slct'],{...preview.paths,slct:''}));
}finally{globalThis.fetch=originalFetch;}
console.log('MS91-only explicit loopback preview guards pass; URL caches stay separate, decode owns copies, failed loads retry, legacy timing unchanged and release remains blocked');
