import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativeMusic} from '../lib/game/native-music.ts';
import {versionedAd15Resource} from '../lib/game/versioned-ad15-resource.ts';
import {initializeMs91AdlibRegisterCache,versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
import type {PhysicsEngineVersion} from '../lib/physics/engine-version.ts';

// Exercise the actual Web Audio-facing controller, without a physical output.
// Fake chip samples do not establish audible quality or real-browser behavior.
const originalFetch=globalThis.fetch;
const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
type Pair=[number,number];
const chips:{writes:Pair[];deleted:boolean;generated:number}[]=[];
class SilentChip {
 record={writes:[] as Pair[],deleted:false,generated:0};
 constructor(){chips.push(this.record);}
 write(register:number,value:number){this.record.writes.push([register,value]);}
 generate(samples:number){this.record.generated+=samples;}
 getBuffer(){return new Int16Array(2048);}
 delete(){this.record.deleted=true;}
}
Object.defineProperty(globalThis,'window',{configurable:true,value:{opl:()=>({then:(ready:(m:unknown)=>void)=>ready({OPL:SilentChip})})}});
globalThis.fetch=(async(url:unknown)=>({ok:true,json:async()=>JSON.parse(readFileSync('public'+String(url),'utf8'))})) as typeof fetch;
function context(){
 const nodes:{released:boolean;disconnected:boolean;started:boolean;buffer:unknown;onended:unknown}[]=[];
 const parameter={value:0,cancelScheduledValues(){},setValueAtTime(value:number){this.value=value;},linearRampToValueAtTime(value:number){this.value=value;}};
 const gain={gain:parameter,connect(){},disconnect(){}};
 const result={state:'running',sampleRate:48000,currentTime:0,destination:{},closed:false,
  createGain:()=>gain,
  createBuffer:(_channels:number,frames:number)=>({getChannelData:()=>new Float32Array(frames)}),
  createBufferSource(){const node={released:false,disconnected:false,started:false,buffer:null as unknown,onended:null as unknown,connect(){},start(){this.started=true;},stop(){this.released=true;},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},
  async close(){this.closed=true;}
 };
 return {result,nodes};
}
try{
 const traces:Pair[][][]=[];
 for(const engine of ['ms-1990','ms-1991'] as PhysicsEngineVersion[]){
  const {result,nodes}=context();const music=await createNativeMusic(result as unknown as AudioContext,engine);
  const chip=chips.at(-1)!;const sequence:Pair[][]=[];let offset=chip.writes.length;
  try{
   music.setOutputMuted(true);
   for(const score of ['titl','slct','over','vict','titl'] as const){
    music.play(score);assert.ok(nodes.at(-1)?.started);
    sequence.push(chip.writes.slice(offset));offset=chip.writes.length;
    music.control('pause-audio');music.control('resume-audio');
    sequence.push(chip.writes.slice(offset));offset=chip.writes.length;
   }
   assert.ok(chip.generated>0);
   music.stop();assert.ok(nodes.every(n=>n.released&&n.disconnected&&n.buffer===null));
   music.close();music.close();assert.ok(chip.deleted&&result.closed);
   const count=chip.writes.length;music.play('titl');assert.equal(chip.writes.length,count);
   traces.push(sequence);
  }finally{music.close();}
 }
 const expected=versionedAd15Resource('ms-1991')!;initializeMs91AdlibRegisterCache(expected);
 assert.equal(traces[0].length,traces[1].length);
 for(let i=0;i<traces[0].length;i++)assert.deepEqual(traces[1][i],versionedAdlibRegisterWrites(expected,traces[0][i],'ms-1991'));
 console.log('Actual native music controller: both generations, five score switches, pause/resume, retained cache and source cleanup pass silently; fake chip, not browser PCM proof');
}finally{
 globalThis.fetch=originalFetch;
 if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');
}
