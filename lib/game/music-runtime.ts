import {resetAdlibTrack} from './adlib-track-stop.ts';
import {applyMusicSequenceControl} from './music-sequence-control.ts';
import {applyAdlibTrackControl} from './adlib-track-control.ts';
import {adlibUpdate} from './adlib-update.ts';
import type {OriginalMenuAudioEffect} from './menu-audio-control.ts';
import {readSoundCommand} from './sound-command.ts';
import {stepOriginalMusicTimer} from './music-timer.ts';
import {stepAdlibVoiceTimer} from './adlib-voice-timer.ts';
import {stepVoiceDuration} from './voice-duration.ts';
import {startAdlibNote,ADLIB_CHANNEL_MASKS} from './adlib-note-start.ts';
import {adlibRelease,adlibReset} from './adlib-release.ts';
import {adlibVolume} from './adlib-volume.ts';
export interface OriginalMusicSeed {header:number;bank:number[];voices:number[];timers:number[][];hardware:number[][];lastNotes:number[];velocities:number[];initialWrites:number[][];percussion:number[][];markers?:number[];masterVolume?:number;commandArgument?:number}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
/** Original music command execution for the supplied TITL and SLCT scores.
 * The seed is the original loader's initialized state; playback is native. */
export function createOriginalMusicRuntime(seed:OriginalMusicSeed){
 const bank=Uint8Array.from(seed.bank),patches=Uint8Array.from(seed.voices),header=seed.header;
 let timers=seed.timers.map(t=>Uint8Array.from(t)),voices=seed.hardware.map(t=>Uint8Array.from(t)),lastNotes=Uint8Array.from(seed.lastNotes),velocities=seed.velocities.slice();
 let commandArgument=seed.commandArgument??0;
 const markers=Uint8Array.from(seed.markers??Array(24).fill(0));
 const state={masterVolume:seed.masterVolume??127,accumulator:0,interval:128,tracks:bank[header+7+bank[header+6]*4]};
 const instrumentAt=(offset:number,segment:number)=>{if(segment!==0x9000)throw Error('Invalid original music instrument segment');return patches.slice(offset,offset+100);};
 let writes:number[][]=[];
 function release(){for(let i=0;i<voices.length;i++){const v=voices[i];if(!v[1]||v[0]>=16)continue;const next=stepVoiceDuration(v,timers[v[0]][0x25]);voices[i]=next.record;for(const ch of next.releaseChannels)writes.push(...adlibRelease(ch-1,view(next.record).getUint16(6,true)));}}
 function sequence(owner:number){
  let timer=timers[owner],v=view(timer);
  if(v.getUint32(0x18,true)){v.setUint32(0x18,v.getUint32(0x18,true)-1,true);return;}
  if(!v.getUint32(0,true))return;
  let commands=0;
  while(v.getUint32(0,true)&&!v.getUint32(0x18,true)){
   if(++commands>65536)throw Error('Original music sequence failed to advance');
   const pointer=v.getUint16(0,true);if(v.getUint16(2,true)!==0x8000)throw Error('Invalid original music sequence segment');
   const c=readSoundCommand(bank,pointer),op=c.opcode;if(c.argument!==undefined)commandArgument=c.argument;if(op<128)commandArgument=timer[0x22];const arg=commandArgument;v.setUint16(0,pointer+c.length,true);
   if(op<0xd9){
    let offset=v.getUint16(0x1e,true),segment=v.getUint16(0x20,true);let instrument=instrumentAt(offset,segment);
    if(instrument[5]===5){const note=op&127,map=[0,2,1,2,2,2,5,2,6,2,6,2,2,3,2,4];[offset,segment]=seed.percussion[note>=24&&note<=39?map[note-24]:2];instrument=instrumentAt(offset,segment);}
    const command=new Uint8Array(10);command[4]=op&127;command[5]=op<128?timer[0x22]:arg;view(command).setUint32(6,c.duration??0,true);
    const next=startAdlibNote({alternate:false,channelMasks:Array.from(ADLIB_CHANNEL_MASKS),owner,instrument,instrumentPointer:{offset,segment},timers,voices,lastNotes,command},{driverSegment:0x39e1,velocities});
    ({timers,voices,lastNotes,velocities}=next);writes.push(...next.writes);timer=timers[owner];v=view(timer);
   }else if(op===0xd9){
    if(timer[4]){const p=5+timer[4]*4;v.setUint32(0,v.getUint32(p,true),true);timer[4]--;}
    else{v.setUint32(0,0,true);for(let i=0;i<voices.length;i++){const voice=voices[i];if(voice[0]!==owner)continue;if(i>0)writes.push(...adlibReset(i-1));voice[0]=255;voice[1]=0;voice[2]=0;view(voice).setUint32(16,0,true);}timer[0x15]=0;}
   }else if(op===0xda)writes.push(...resetAdlibTrack(timers,voices,lastNotes,markers,owner,state.masterVolume));
   else if(applyMusicSequenceControl(timer,op,arg,c.duration??0)){}
   else if(op===0xdc){const at=header+7+arg*4;v.setUint32(0x1e,view(bank).getUint32(at,true),true);}
   else if(op===0xdd){if(!arg)throw Error('Original score specifies zero tempo');state.interval=Math.floor(32000/arg);}
   else if(op===0xde){timer[0x28]=arg;for(let i=1;i<voices.length;i++)if(voices[i][0]===owner){const rv=view(voices[i]);writes.push(...adlibVolume(Array.from(instrumentAt(rv.getUint16(16,true),rv.getUint16(18,true))),i-1,arg,velocities[i-1]));}}
   else if(op===0xdf)writes.push(...applyAdlibTrackControl(timers,voices,owner,arg,c.duration??0,velocities,instrumentAt));
   else if(op===0xe0)timer[0x16]=arg;
   else if(op===0xe1)timer[0x24]=arg;
   else if(op===0xe2){const depth=timer[0x32];v.setUint32(0x33+4*depth,v.getUint32(0,true),true);timer[0x43+depth]=(arg-1)&255;timer[0x32]++;}
   else if(op===0xe3){const depth=timer[0x32];if(depth){v.setUint32(0,v.getUint32(0x2f+depth*4,true),true);const remaining=timer[0x42+depth];timer[0x42+depth]--;if(!remaining)timer[0x32]--;}}
   else if(op===0xe4)timer[0x22]=arg;
   else if(op===0xe5){const value=c.duration??0;let low=value&255;if(value&256)low|=128;v.setInt16(0x26,((value&0xff00)>>>1)+(low<<24>>24)-8192,true);}
   else if(op===0xea)markers[owner]=arg;
   else throw Error('Music command not yet integrated: '+op.toString(16));
   if(v.getUint32(0,true))v.setUint32(0x18,readSoundCommand(bank,v.getUint16(0,true)).delay,true);
  }
  // The original falls through to SUB/SBB even after an end command.
  v.setUint32(0x18,(v.getUint32(0x18,true)-1)>>>0,true);
 }
 function control(effect:OriginalMenuAudioEffect):number[][]{
  const output:number[][]=[];
  if(effect.type==='volume'){
   timers[effect.owner][0x28]=effect.value;
   for(let i=1;i<voices.length;i++)if(voices[i][0]===effect.owner){const rv=view(voices[i]);output.push(...adlibVolume(Array.from(instrumentAt(rv.getUint16(16,true),rv.getUint16(18,true))),i-1,effect.value,velocities[i-1]));}
  }else if(effect.type==='update-voice'){
   const voice=voices[effect.index];if(voice?.[1]&&voice[44]){const rv=view(voice),timer=timers[(rv.getUint16(42,true)-0x801e)/72],next=adlibUpdate(voice,timer,Array.from(instrumentAt(rv.getUint16(16,true),rv.getUint16(18,true))),voice[44]-1);voices[effect.index]=next.record;output.push(...next.writes);}
  }else if(effect.type==='stop-tracks'){
   for(let i=0;i<voices.length;i++){const voice=voices[i];if(voice[0]<effect.first||voice[0]>effect.last)continue;if(i>0)output.push(...adlibReset(i-1));voice[0]=255;voice[1]=0;voice[2]=0;view(voice).setUint32(16,0,true);}
   for(let i=effect.first;i<=effect.last;i++)timers[i][0x15]=0;
  }else if(effect.type==='master-volume')throw Error('Alternate music driver is not the native AdLib driver');
  return output;
 }
 return {state,control,get markers(){return markers;},get timers(){return timers;},get voices(){return voices;},get lastNotes(){return lastNotes;},tick(sequenceEnabled=true){writes=[];const updated=stepAdlibVoiceTimer({timers,voices,lastNotes},instrumentAt);({timers,voices,lastNotes}=updated);writes.push(...updated.writes);if(sequenceEnabled)stepOriginalMusicTimer(state,release,sequence);else release();return writes;}};
}
