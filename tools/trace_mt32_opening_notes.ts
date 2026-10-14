/** Diagnostic note delivery trace, no audio quality/physical timing claim. */
import {readFileSync} from 'node:fs';
import {createOwnedTimedMt32Device} from '../lib/game/owned-timed-mt32-device.ts';
import {initializeTimedMt32Device} from '../lib/game/timed-mt32-startup.ts';
import {createTimedMt32ScoreStream} from '../lib/game/timed-mt32-score-stream.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {createMt32AudioStream} from '../lib/game/mt32-audio-stream.ts';
const seconds=Number(process.argv[2]??1);
if(!Number.isSafeInteger(seconds)||seconds<1||seconds>120)throw Error('Trace duration must be 1..120 seconds');
for(const mode of ['ready','timed'] as const)for(const generation of ['ms-1990','ms-1991'] as const)for(const name of ['titl','slct','vict','over']){
 let position=0,status=0,sysex=false;const data:number[]=[],notes:{sample:number;channel:number;note:number;velocity:number}[]=[],events:number[][]=[];
 const device={sampleRate:32000,render(frames:number){position+=frames;return new Float32Array(frames*2);},write(writes:number[][]){
  for(const [port,byte] of writes){
   if(port!==0x330)continue;
   if(byte>=0xf8)continue;
   if(byte===0xf0){sysex=true;status=0;data.length=0;continue;}
   if(byte===0xf7){sysex=false;continue;}if(sysex)continue;
   if(byte&128){status=byte;data.length=0;continue;}if(!status)continue;
   data.push(byte);const count=(status&0xe0)===0xc0?1:2;
   if(data.length===count){events.push([position,status,...data]);if((status&0xf0)===0x90&&data[1])notes.push({sample:position,channel:status&15,note:data[0],velocity:data[1]});data.length=0;}
  }
 }};
 const owner=createOwnedTimedMt32Device(device,{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}});
 const seed=versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),generation);
 await initializeTimedMt32Device(Uint8Array.from(seed.driver),readFileSync('public/game/original-resources/MT32.PLB'),generation,owner);
 const readyRuntime=mode==='ready'?createOriginalMt32MusicRuntime(seed):undefined;
 const readyStream=readyRuntime?createMt32AudioStream(device,()=>readyRuntime.tick().writes):undefined;
 const score=readyStream?{render:(frames:number)=>Promise.resolve(readyStream.render(frames)),close(){},get settings(){return readyRuntime!.state;}}:await createTimedMt32ScoreStream(seed,owner.output,owner.transport);
 if(readyStream)device.write(seed.initialWrites);
 owner.output.render(512);
 const origin=position;
 for(let i=0;i<32000*seconds;i+=512)await score.render(Math.min(512,32000*seconds-i));
 const stamp=(note:typeof notes[number])=>({...note,ms:((note.sample-origin)*1000/32000)});
 console.log(JSON.stringify({mode,generation,name,seconds,noteCount:notes.length,notes:notes.slice(0,12).map(stamp),...(process.argv.includes('--all-notes')?{allNotes:notes.map(note=>[(note.sample-origin)*1000/32000,note.channel,note.note,note.velocity])}:{}),...(process.argv.includes('--all-events')?{allEvents:events.map(([sample,...event])=>[(sample-origin)*1000/32000,...event])}:{}),milestones:notes.flatMap((note,index)=>index%50===0?[{index,...stamp(note)}]:[]),tempo:score.settings}));
 if(name==='slct'){
  const first=notes.slice(0,6);if(first.length!==6)throw Error('Missing opening Menu notes');
  const spread=first[5].sample-first[0].sample;
  if(mode==='ready'&&spread!==0)throw Error('Ready playback did not batch opening chord');
  if(mode==='timed'&&generation==='ms-1991'&&(spread<4400||spread>4600))throw Error('Modern opening stagger changed');
 }
 score.close();owner.close();
}
