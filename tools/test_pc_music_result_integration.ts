import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runNativeRaceResults,type NativeRaceResultsState} from '../lib/game/native-race-results.ts';
import {versionedPcMusicSeed} from '../lib/game/versioned-pc-music-seed.ts';
import {createControlledOriginalPcSpeakerMusic} from '../lib/game/controlled-pc-speaker-music.ts';
import {createOriginalPcSpeakerMusicStream} from '../lib/game/pc-speaker-audio.ts';
import {originalRaceResultLines} from '../lib/game/race-result-lines.ts';
import {createControlledOriginalTandyMusic} from '../lib/game/controlled-tandy-music.ts';
import {createOriginalTandyToneStream} from '../lib/game/tandy-tone-audio.ts';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {runInThisContext} from 'node:vm';
import {createControlledOriginalMusic} from '../lib/game/controlled-music-runtime.ts';
import {createOplOutput} from '../lib/game/opl-output.ts';
import {createAudioRuntimeStream} from '../lib/game/player-audio-stream.ts';
import {versionedAd15Resource} from '../lib/game/versioned-ad15-resource.ts';
import {initializeMs91AdlibRegisterCache,versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
// Execute the same bundled OPL implementation used by the browser, offline.
const oplPath=resolve('public/audio/opl.js'),oplModule={exports:{} as any};
runInThisContext('(function(module,exports,require,__dirname){'+readFileSync(oplPath,'utf8')+'\n})',{filename:oplPath})(oplModule,oplModule.exports,createRequire(oplPath),dirname(oplPath));
const opl=await new Promise<any>((resolve,reject)=>oplModule.exports({wasmBinary:readFileSync('public/audio/opl.wasm'),onAbort:reject}).then((module:any)=>resolve({OPL:module.OPL})));
const resources=Object.fromEntries(['eelt','econ','ednf','eppt','eowt','eolt'].map(key=>[key,[...key].map(c=>c.charCodeAt(0)).concat(0)]));
const scenarios=[
 {name:'solo finish',playerTime:100,opponentTime:0,opponentSelected:0,music:'over'},
 {name:'solo unfinished',playerTime:0,opponentTime:0,opponentSelected:0,music:'over'},
 {name:'win',playerTime:100,opponentTime:200,opponentSelected:1,music:'vict'},
 {name:'tie goes to player',playerTime:100,opponentTime:100,opponentSelected:1,music:'vict'},
 {name:'opponent unfinished',playerTime:100,opponentTime:0,opponentSelected:1,music:'vict'},
 {name:'lose',playerTime:200,opponentTime:100,opponentSelected:1,music:'over'},
 {name:'player unfinished',playerTime:0,opponentTime:100,opponentSelected:1,music:'over'},
 {name:'both unfinished',playerTime:0,opponentTime:0,opponentSelected:1,music:'over'},
 {name:'penalty turns faster elapsed run into loss',playerTime:220,penaltyTime:120,opponentTime:200,opponentSelected:1,music:'over'},
 {name:'penalty total ties opponent',playerTime:200,penaltyTime:100,opponentTime:200,opponentSelected:1,music:'vict'},
 {name:'penalty total still wins',playerTime:180,penaltyTime:80,opponentTime:200,opponentSelected:1,music:'vict'}
];
let cases=0;
for(const soundDevice of ['pc-speaker','tandy','adlib'] as const)
// Sound-driver identity belongs to the launched edition, not a loaded replay.
// Test both identities independently so automatic physics routing is covered.
for(const soundGeneration of ['ms-1990','ms-1991'] as const)
for(const physicsEngine of ['ms-1990','ms-1991'] as const)
for(const framesPerSecond of (physicsEngine==='ms-1990'?[20]:[10,20]) as (10|20)[])
for(const scenario of scenarios){
 const played:string[]=[],events:string[]=[];
 const state:NativeRaceResultsState={
  panel:{physicsEngine,framesPerSecond,playerTime:scenario.playerTime,opponentTime:scenario.opponentTime,penaltyTime:scenario.penaltyTime??0,playerTicks:100,opponentTicks:0,timeAdjustment:0,speedSum:0,impactSpeed:0,topSpeed:0,jumps:0,flags:0,opponentSelected:scenario.opponentSelected},
  track:new Uint8Array(1802),trackName:'QA',trackPath:'',scores:{file:new Uint8Array(364),order:[0,1,2,3,4,5,6],selected:0,name:'',retainedRecord:Array(52).fill(0)},
  choices:{current:[0,0,0],previous:[0,0,0]},raceCounter:0,retainedCandidateTime:0,carName:'COUN',opponentCode:'',opponentCarCode:''
 };
 const track=state.track.slice(),scores=state.scores.file.slice();
 const action=await runNativeRaceResults({
  pixels:new Uint8Array(65536),font:new Uint8Array(65536),smallFont:new Uint8Array(65536),resources:{},
  playResultMusic(name){
   played.push(name);events.push('music');
   const prefix=soundDevice==='adlib'?'':soundDevice==='tandy'?'tandy-':'pc-';
   const resourcePath=`public/game/${prefix}music-${name}-seed.json`;
   const source=readFileSync(resourcePath,'utf8');
   const seed=JSON.parse(source);
   let samples:Float32Array|Int16Array;
   if(soundDevice==='adlib'){
    const chip=new opl.OPL(88200,2,2048),output=createOplOutput(chip);
    try{
     const driver=versionedAd15Resource(soundGeneration);
     if(driver)for(const [register,value] of initializeMs91AdlibRegisterCache(driver))output.write(register,value);
     const initialWrites=versionedAdlibRegisterWrites(driver??new Uint8Array(),seed.initialWrites,soundGeneration);
     const runtime=createControlledOriginalMusic(seed,driver?{driverGeneration:soundGeneration,driver}:undefined);
     samples=createAudioRuntimeStream({initialWrites,tick:()=>runtime.tick()},output,44100).render(44100);
    }finally{chip.delete();}
   }else if(soundDevice==='tandy'){
    const runtime=createControlledOriginalTandyMusic(seed,soundGeneration);
    const stream=createOriginalTandyToneStream({tick:()=>runtime.tick(0)},seed.initialWrites,44100,{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1});
    samples=stream.render(44100);
   }else{
    const versioned=versionedPcMusicSeed(seed,soundGeneration);
    samples=createOriginalPcSpeakerMusicStream(createControlledOriginalPcSpeakerMusic(versioned),versioned.initialWrites,44100).render(44100);
   }
   assert.ok(samples.every(Number.isFinite));assert.ok(samples.some(v=>v!==0),'Selected outcome score generates sound');
   assert.equal(readFileSync(resourcePath,'utf8'),source,'Outcome playback must not alter source resources');
  },
  present(){},async input(){return {key:0,x:0,y:0,mouseActive:false,buttons:0};},async release(){},async gameCounter(){return 0;},
  async enumerate(){return [];},async editPath(){return {path:'',key:0};},counter(){return 0;},
  files:{async readSavedTrack(){throw Error('Unexpected track access');},async readScores(){throw Error('Unexpected score access');},async insertTrackDisk(){return 0;},async writeScores(){throw Error('Outcome audio must not write scores');}},
  async evaluation(){throw Error('Solo result has no opponent evaluation');},randomWord(){return 0;},randomByte(){return 0;},
  async prepareScores(){events.push('eligibility');return {status:0,candidateTime:100};}
 },state,{
  // Use the real result-time/outcome calculation; opponent portrait rendering
  // is separate from this score-selection and native result-loop check.
  panel(){return {...originalRaceResultLines(state.panel,resources),evaluationAvailable:0};},async prepareEvaluation(){},portrait(){},clearTop(){},scores(){events.push('scores');},evaluation(){},async continueEvaluation(){return 13;},async enterScore(){throw Error('Unexpected score entry');},unavailable(){},
  async endMenu(host,flags){events.push('end-menu');await host.review({...flags,selected:0});await host.review({...flags,selected:0});return 2;}
 });
 assert.equal(action,2);assert.deepEqual(played,[scenario.music],`${scenario.name}: actual outcome and repeated review select exactly one score`);
 assert.deepEqual(events.slice(0,4),['music','eligibility','scores','end-menu']);
 assert.deepEqual(state.track,track);assert.deepEqual(state.scores.file,scores);cases++;
}
assert.equal(cases,198,'All three devices, independent sound/physics versions, supported cadences and eleven outcomes must execute');
console.log(`${cases} native result/PC, Tandy and real bundled OPL music integrations pass independent sound/physics versions and supported cadences, repeated review, finite nonzero PCM and unchanged track/score/resource bytes; offline synthesis, not browser output verification`);
