import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ms91SunoMusic} from '../lib/game/ms91-suno-music.ts';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createTimedMt32SongFactory} from '../lib/game/timed-mt32-song-factory.ts';
import {createNativeTimedMt32Music} from '../lib/game/native-timed-mt32-music.ts';
import {createSynchronizedRemixedMusic} from '../lib/game/remixed-music.ts';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';
import {startNativeMusic} from '../lib/game/native-music-start.ts';
import {runNativeRaceResults,type NativeRaceResultsState} from '../lib/game/native-race-results.ts';
import {originalRaceResultLines} from '../lib/game/race-result-lines.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';

const packaged=process.argv.includes('--packaged');
const preview=packaged?ms91SunoMusic('ms-1991')!:browserMs91SunoScorePreview('ms-1991',{hostname:'localhost',search:'?preview-suno-score=1'})!;
const buffers:Record<string,AudioBuffer>={},hashes=new Map<string,string>();
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
for(const [name,url] of Object.entries(preview.paths)){
 const path=packaged?'public'+url:'/private/tmp/'+new URL(url).pathname.slice('/files/'.length),bytes=readFileSync(path);hashes.set(path,hash(bytes));
 if(packaged){
  const pcm=execFileSync('ffmpeg',['-v','error','-i',path,'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
  assert.equal(pcm.length%8,0);let peak=0;const decodedView=new DataView(pcm.buffer,pcm.byteOffset,pcm.byteLength);
  for(let offset=0;offset<pcm.length;offset+=4){const value=decodedView.getFloat32(offset,true);assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}
  assert.ok(peak>0&&peak<1);const duration=pcm.length/8/48000;
  const timing=preview.timing[name as keyof typeof preview.timing];assert.ok(duration>timing.introDuration!+timing.loopDuration);
  buffers[name]={duration,sampleRate:48000} as AudioBuffer;continue;
 }
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ascii=(start:number,end:number)=>new TextDecoder().decode(bytes.subarray(start,end));
 assert.equal(ascii(0,4),'RIFF');assert.equal(ascii(8,12),'WAVE');
 assert.equal(view.getUint16(20,true),3);assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint16(34,true),32);
 let dataOffset=0,dataLength=0;
 for(let offset=12;offset+8<=bytes.length;){const size=view.getUint32(offset+4,true);assert.ok(offset+8+size<=bytes.length);if(ascii(offset,offset+4)==='data'){dataOffset=offset+8;dataLength=size;break;}offset+=8+size+(size&1);}
 assert.ok(dataOffset>0&&dataLength>0&&dataLength%8===0);
 let peak=0;for(let offset=dataOffset;offset<dataOffset+dataLength;offset+=4){const value=view.getFloat32(offset,true);assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}
 assert.ok(peak>0&&peak<1);
 buffers[name]={duration:dataLength/8/48000,sampleRate:48000} as AudioBuffer;
}
const names=['titl','slct','vict','over'] as const;
const seeds=Object.fromEntries(names.map(name=>[name,JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'))]));
const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
const sources:any[]=[];
const context={currentTime:0,state:'running',destination:{},createGain(){return {gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};},createBuffer(_channels:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},createBufferSource(){const source={buffer:null,loopStart:0,loopEnd:0,connect(){},disconnect(){},stopped:false,start(){},stop(){this.stopped=true;}};sources.push(source);return source;}} as unknown as AudioContext;
const factory=createTimedMt32SongFactory(device,seeds as never,readFileSync('public/game/original-resources/MT32.PLB'),'ms-1991',{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:async()=>{}});
const original=createNativeTimedMt32Music(context,factory);
const music=createSynchronizedRemixedMusic(context,original as never,buffers,true,preview.timing);
const scenarios=[['solo finish',100,0,0,'over',0],['solo unfinished',0,0,0,'over',0],['win',100,200,1,'vict',0],['tie',100,100,1,'vict',0],['opponent unfinished',100,0,1,'vict',0],['lose',200,100,1,'over',0],['player unfinished',0,100,1,'over',0],['both unfinished',0,0,1,'over',0],['penalty loses',220,200,1,'over',120],['penalty ties',200,200,1,'vict',100],['penalty still wins',180,200,1,'vict',80]] as const;
const resources=Object.fromEntries(['eelt','econ','ednf','eppt','eowt','eolt'].map(key=>[key,[...key].map(c=>c.charCodeAt(0)).concat(0)]));
try{
 for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const framesPerSecond of (physicsEngine==='ms-1990'?[20]:[10,20]) as (10|20)[])for(const [label,playerTime,opponentTime,opponentSelected,expected,penaltyTime] of scenarios){
  const state:NativeRaceResultsState={panel:{physicsEngine,framesPerSecond,playerTime,opponentTime,penaltyTime,playerTicks:100,opponentTicks:0,timeAdjustment:0,speedSum:0,impactSpeed:0,topSpeed:0,jumps:0,flags:0,opponentSelected},track:new Uint8Array(1802),trackName:'QA',trackPath:'',scores:{file:new Uint8Array(364),order:[0,1,2,3,4,5,6],selected:0,name:'',retainedRecord:Array(52).fill(0)},choices:{current:[0,0,0],previous:[0,0,0]},raceCounter:0,retainedCandidateTime:0,carName:'COUN',opponentCode:'',opponentCarCode:''};
  const track=state.track.slice(),scores=state.scores.file.slice(),played:string[]=[];
  await startNativeMusic(music,'slct');const priorSource=sources.at(-1);
  const action=await runNativeRaceResults({pixels:new Uint8Array(65536),font:new Uint8Array(65536),smallFont:new Uint8Array(65536),resources:{},async playResultMusic(name){played.push(name);await startNativeMusic(music,name);},present(){},async input(){return {key:0,x:0,y:0,mouseActive:false,buttons:0};},async release(){},async gameCounter(){return 0;},async enumerate(){return [];},async editPath(){return {path:'',key:0};},counter(){return 0;},files:{async readSavedTrack(){throw Error('Unexpected read');},async readScores(){throw Error('Unexpected read');},async insertTrackDisk(){return 0;},async writeScores(){throw Error('Unexpected write');}},async evaluation(){throw Error('Unexpected portrait');},randomWord(){return 0;},randomByte(){return 0;},async prepareScores(){return {status:0,candidateTime:100};}},state,{panel(){return {...originalRaceResultLines(state.panel,resources),evaluationAvailable:0};},async prepareEvaluation(){},portrait(){},clearTop(){},scores(){},evaluation(){},async continueEvaluation(){return 13;},async enterScore(){throw Error('Unexpected score entry');},unavailable(){},async endMenu(host,flags){await host.review({...flags,selected:0});await host.review({...flags,selected:0});return 2;}});
  assert.equal(action,2);assert.deepEqual(played,[expected]);assert.equal(priorSource.stopped,true);
  const snapshot=music.playbackSnapshot;assert.equal(snapshot.score,expected);assert.equal(snapshot.hasSource,true);assert.equal(snapshot.sampleRate,48000);assert.equal(snapshot.loopStart,preview.timing[expected].introDuration);assert.equal(snapshot.loopEnd,preview.timing[expected].introDuration!+preview.timing[expected].loopDuration);
  await music.controlAsync('pause-audio');assert.equal(music.playbackSnapshot.hasSource,false);await music.controlAsync('resume-audio');assert.equal(music.playbackSnapshot.hasSource,true);
  await music.stopAsync();assert.equal(music.playbackSnapshot.hasSource,false);assert.equal(original.hasScore,false);assert.ok(sources.every(source=>source.stopped));
  assert.deepEqual(state.track,track);assert.deepEqual(state.scores.file,scores);
  console.log(`${physicsEngine}/${framesPerSecond}Hz/${label}: actual result selects ${expected}, candidate region/stop/pause pass; mocked WebAudio, not listening`);
 }
}finally{music.close();await original.closeAsync();device.close();}
for(const [path,expected] of hashes)assert.equal(hash(readFileSync(path)),expected);
console.log(`33 actual result selections with real MS91 Roland synthesis and ${packaged?'normal packaged audio':'candidate WAV'} validation; no audible fidelity or natural finish claim`);
