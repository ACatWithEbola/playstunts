import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativePcSpeakerMusic} from '../lib/game/native-pc-speaker-music.ts';
import {versionedPcMusicSeed} from '../lib/game/versioned-pc-music-seed.ts';
import {createControlledOriginalPcSpeakerMusic} from '../lib/game/controlled-pc-speaker-music.ts';
import {createOriginalPcSpeakerMusicStream} from '../lib/game/pc-speaker-audio.ts';
const savedFetch=globalThis.fetch;
globalThis.fetch=(async(url:unknown)=>({ok:true,json:async()=>JSON.parse(readFileSync('public'+String(url),'utf8'))})) as typeof fetch;
try{
 for(const engine of [undefined,'ms-1990','ms-1991'] as const){
  const nodes:{buffer:unknown;stopped:boolean;disconnected:boolean}[]=[],buffers:Float32Array[]=[];
  const parameter={value:0,cancelScheduledValues(){},setValueAtTime(value:number){this.value=value;},linearRampToValueAtTime(value:number){this.value=value;}};
  let closed=0;
  const context={state:'running',sampleRate:48000,currentTime:0,destination:{},
   createGain:()=>({gain:parameter,connect(){},disconnect(){}}),
   createBuffer:(_channels:number,frames:number)=>({copyToChannel(samples:Float32Array){assert.equal(samples.length,frames);buffers.push(samples.slice());}}),
   createBufferSource(){const node={buffer:null as unknown,onended:null as unknown,stopped:false,disconnected:false,connect(){},start(){},stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
   async close(){closed++;}
  };
  const music=await createNativePcSpeakerMusic(context as unknown as AudioContext,engine);
  try{
   music.play('titl');assert.ok(buffers.length>0);
   const seed=versionedPcMusicSeed(JSON.parse(readFileSync('public/game/pc-music-titl-seed.json','utf8')),engine);
   const reference=createOriginalPcSpeakerMusicStream(createControlledOriginalPcSpeakerMusic(seed),seed.initialWrites,48000);
   for(const buffer of buffers)assert.deepEqual(buffer,reference.render(buffer.length),'Browser controller uses selected driver PCM');
   for(const score of ['slct','over','vict','titl'] as const){
    music.play(score);music.control('pause-audio');assert.equal(music.settings.paused,true);
    music.control('resume-audio');assert.equal(music.settings.paused,false);
   }
   music.control('toggle-music');const before=buffers.length;music.play('titl');assert.equal(buffers.length,before);
   music.control('toggle-music');music.play('titl');assert.ok(buffers.length>before);
   music.setOutputMuted(true);assert.equal(parameter.value,0);
   music.stop();assert.ok(nodes.every(n=>n.stopped&&n.disconnected&&n.buffer===null));
   music.close();music.close();assert.equal(closed,1);
   const final=buffers.length;music.play('titl');assert.equal(buffers.length,final);
  }finally{music.close();}
 }
 console.log('PC browser controller: selected-driver PCM, five score transitions, pause/resume, mute, music toggle and complete source disposal pass with simulated Web Audio');
}finally{globalThis.fetch=savedFetch;}
