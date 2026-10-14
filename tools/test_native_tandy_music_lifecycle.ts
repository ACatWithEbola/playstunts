import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativeTandyMusic} from '../lib/game/native-tandy-music.ts';
import {createControlledOriginalTandyMusic} from '../lib/game/controlled-tandy-music.ts';
import {createOriginalTandyToneStream} from '../lib/game/tandy-tone-audio.ts';
const savedFetch=globalThis.fetch;
globalThis.fetch=(async(url:unknown)=>({ok:true,json:async()=>JSON.parse(readFileSync('public'+String(url),'utf8'))})) as typeof fetch;
try{
 for(const generation of [undefined,'ms-1990','ms-1991'] as const){
  const nodes:{buffer:unknown;stopped:boolean;disconnected:boolean}[]=[],buffers:Float32Array[]=[];
  const parameter={value:0,cancelScheduledValues(){},setValueAtTime(value:number){this.value=value;},linearRampToValueAtTime(value:number){this.value=value;}};
  let closed=0;
  const context={state:'running',sampleRate:48000,currentTime:0,destination:{},
   createGain:()=>({gain:parameter,connect(){},disconnect(){}}),
   createBuffer:(_channels:number,frames:number)=>({copyToChannel(samples:Float32Array){assert.equal(samples.length,frames);buffers.push(samples.slice());}}),
   createBufferSource(){const node={buffer:null as unknown,onended:null as unknown,stopped:false,disconnected:false,connect(){},start(){},stop(){this.stopped=true;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
   async close(){closed++;}
  };
  const source=readFileSync('public/game/tandy-music-titl-seed.json','utf8'),seed=JSON.parse(source);
  const music=await createNativeTandyMusic(context as unknown as AudioContext,generation);
  try{
   music.play('titl');assert.ok(buffers.length>0);
   const referenceRuntime=createControlledOriginalTandyMusic(seed,generation);
   const reference=createOriginalTandyToneStream({tick:()=>referenceRuntime.tick(0)},referenceRuntime.runtime.initialWrites,48000,{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1});
   for(const buffer of buffers)assert.deepEqual(buffer,reference.render(buffer.length),'Browser controller delivers selected-generation initialization and PCM');
   for(const score of ['slct','over','vict','titl'] as const){
    music.play(score);music.control('pause-audio');assert.equal(music.settings.paused,true);
    music.control('resume-audio');assert.equal(music.settings.paused,false);
   }
   music.control('toggle-sound');music.control('pause-audio');music.play('slct');
   assert.equal(music.settings.soundEnabled,false);assert.equal(music.settings.paused,true);
   music.control('resume-audio');music.control('toggle-sound');
   music.control('toggle-music');const before=buffers.length;music.play('titl');assert.equal(buffers.length,before);
   music.control('toggle-music');music.play('titl');assert.ok(buffers.length>before);
   music.setOutputMuted(true);assert.equal(parameter.value,0);
   music.stop();assert.ok(nodes.every(n=>n.stopped&&n.disconnected&&n.buffer===null));
   music.close();music.close();assert.equal(closed,1);
   const final=buffers.length;music.play('titl');assert.equal(buffers.length,final);
   assert.equal(readFileSync('public/game/tandy-music-titl-seed.json','utf8'),source);
  }finally{music.close();}
 }
 console.log('Tandy browser controller: selected-generation startup/PCM, score changes, retained pause/sound settings, toggles, mute and disposal pass; fake Web Audio only');
}finally{globalThis.fetch=savedFetch;}
