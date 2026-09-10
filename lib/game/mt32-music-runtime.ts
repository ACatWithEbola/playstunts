import {applyMusicSequenceControl} from './music-sequence-control.ts';
import {applyOriginalMt32TrackControl,stopOriginalMt32Track} from './mt32-track-control.ts';
import {applyOriginalMt32DriverControl,type OriginalMt32Control} from './mt32-driver-control.ts';
import {startOriginalMt32AllocatedNote} from './mt32-note-start.ts';
import {stepOriginalMt32VoiceTimer} from './mt32-voice-timer.ts';
import type {OriginalMusicSeed} from './music-runtime.ts';
import {readSoundCommand} from './sound-command.ts';
import {stepOriginalMusicTimer} from './music-timer.ts';
import {stepVoiceDuration} from './voice-duration.ts';
import type {OriginalMenuAudioEffect} from './menu-audio-control.ts';
import {sendOriginalMt32SystemExclusive} from './mt32-system-exclusive.ts';
export interface OriginalMt32MusicSeed extends OriginalMusicSeed {driver:number[];nullInstrument:number[];systemVolume:number[]}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
/** Original alternate-driver command execution for TITL/SLCT. MIDI output
 * assumes a ready MPU; device handshakes and physical Roland synthesis are
 * separate. The captured null-instrument bytes preserve the source's unsafe
 * DC dereference. Raw E8 scratch-buffer output remains explicitly unsupported. */
export function createOriginalMt32MusicRuntime(seed:OriginalMt32MusicSeed){
 const bank=Uint8Array.from(seed.bank),patches=Uint8Array.from(seed.voices),header=seed.header;
 let timers=seed.timers.map(t=>Uint8Array.from(t)),voices=seed.hardware.map(t=>Uint8Array.from(t)),lastNotes=Uint8Array.from(seed.lastNotes);
 let commandArgument=seed.commandArgument??0;const driver=Uint8Array.from(seed.driver);
 const markers=Uint8Array.from(seed.markers??Array(24).fill(0));
 const state={masterVolume:seed.masterVolume??127,accumulator:0,interval:128,tracks:bank[header+7+bank[header+6]*4]};
 const instrumentAt=(offset:number,segment:number)=>{if(!(offset||segment)){if(seed.nullInstrument.length!==100)throw Error('Missing original null-instrument memory');return Uint8Array.from(seed.nullInstrument);}if(segment!==0x9000)throw Error('Invalid original music instrument segment');return patches.slice(offset,offset+100);};
 let writes:number[][]=[];
 const emit=(kind:OriginalMt32Control,channel:number,record:Uint8Array,patch:Uint8Array,value=0,extra=0)=>writes.push(...applyOriginalMt32DriverControl(kind,channel,record,patch,value,extra).writes);
 const emptyVoice=new Uint8Array(46),emptyPatch=new Uint8Array(100);
 const volume=(owner:number,value:number)=>{timers[owner][0x28]=value;emit('volume',timers[owner][0x47],emptyVoice,emptyPatch,value);};
 function stopTrack(owner:number){return stopOriginalMt32Track(timers,voices,owner).writes;}
 function release(){for(let i=0;i<voices.length;i++){const v=voices[i];if(!v[1]||v[0]>=16)continue;const next=stepVoiceDuration(v,timers[v[0]][0x25]);voices[i]=next.record;for(const channel of next.releaseChannels)emit('release',channel,next.record,emptyPatch);}}
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
    let offset=v.getUint16(0x1e,true),segment=v.getUint16(0x20,true);let instrument=(offset||segment)?instrumentAt(offset,segment):new Uint8Array(100);
    if(instrument[5]===5){const note=op&127,map=[0,2,1,2,2,2,5,2,6,2,6,2,2,3,2,4];[offset,segment]=seed.percussion[note>=24&&note<=39?map[note-24]:2];instrument=(offset||segment)?instrumentAt(offset,segment):new Uint8Array(100);}
    const command=new Uint8Array(10);command[4]=op&127;command[5]=op<128?timer[0x22]:arg;view(command).setUint32(6,c.duration??0,true);
    const next=startOriginalMt32AllocatedNote({alternate:true,channelMasks:[],owner,instrument,instrumentPointer:{offset,segment},timers,voices,lastNotes,command});
    ({timers,voices,lastNotes}=next);writes.push(...next.writes);timer=timers[owner];v=view(timer);
   }else if(op===0xd9){
    if(timer[4]){const p=5+timer[4]*4;v.setUint32(0,v.getUint32(p,true),true);timer[4]--;}
    else{v.setUint32(0,0,true);writes.push(...stopTrack(owner));}
   }else if(op===0xda)writes.push(...resetTrack(owner));
   else if(op===0xe8)throw Error('MT15 raw score output requires the original retained command scratch area');
   else if(applyMusicSequenceControl(timer,op,arg,c.duration??0)){}
   else if(op===0xdc){const at=header+7+arg*4;v.setUint32(0x1e,view(bank).getUint32(at,true),true);const patch=instrumentAt(v.getUint16(0x1e,true),v.getUint16(0x20,true));timer[0x47]=patch[67]<16?patch[67]:(owner&15)+1;volume(owner,timer[0x28]);emit('instrument',timer[0x47],emptyVoice,patch);}
   else if(op===0xdd){if(!arg)throw Error('Original score specifies zero tempo');state.interval=Math.floor(32000/arg);}
   else if(op===0xde)volume(owner,arg);
   else if(op===0xdf)writes.push(...applyOriginalMt32TrackControl(timers,voices,owner,arg,c.duration??0).writes);
   else if(op===0xe0)timer[0x16]=arg;
   else if(op===0xe1)timer[0x24]=arg;
   else if(op===0xe2){const depth=timer[0x32];v.setUint32(0x33+4*depth,v.getUint32(0,true),true);timer[0x43+depth]=(arg-1)&255;timer[0x32]++;}
   else if(op===0xe3){const depth=timer[0x32];if(depth){v.setUint32(0,v.getUint32(0x2f+depth*4,true),true);const remaining=timer[0x42+depth];timer[0x42+depth]--;if(!remaining)timer[0x32]--;}}
   else if(op===0xe4)timer[0x22]=arg;
   else if(op===0xe5){let value=c.duration??0;let low=value&255;if(value&256)low|=128;v.setInt16(0x26,((value&0xff00)>>>1)+(low<<24>>24)-8192,true);emit('bend',timer[0x47],emptyVoice,emptyPatch,v.getInt16(0x26,true));}
   else if(op===0xea)markers[owner]=arg;
   else throw Error('Music command not yet integrated: '+op.toString(16));
   if(v.getUint32(0,true))v.setUint32(0x18,readSoundCommand(bank,v.getUint16(0,true)).delay,true);
  }
  // The original falls through to SUB/SBB even after an end command.
  v.setUint32(0x18,(v.getUint32(0x18,true)-1)>>>0,true);
 }
 function resetTrack(owner:number){
  const result=stopTrack(owner),timer=timers[owner],v=view(timer);
  for(const [at,value] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,state.masterVolume],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[at]=value;
  for(const at of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(at,0,true);lastNotes[owner]=0;markers[owner]=0;return result;
 }
 function control(effect:OriginalMenuAudioEffect){
  writes=[];
  if(effect.type==='volume')volume(effect.owner,effect.value);
  else if(effect.type==='stop-tracks')writes.push(...stopOriginalMt32Track(timers,voices,effect.first,effect.last).writes);
  else if(effect.type==='update-voice'){
   const voice=voices[effect.index];if(voice?.[1]){const v=view(voice);emit('update',voice[44],voice,instrumentAt(v.getUint16(16,true),v.getUint16(18,true)));}
  }else if(effect.type==='master-volume'){
   if(seed.systemVolume.length!==4)throw Error('Missing original Roland system-volume packet');
   const packet=Uint8Array.from(seed.systemVolume);packet[3]=effect.value;
   const program=sendOriginalMt32SystemExclusive(driver,(_segment,offset)=>packet[offset],0,0,4);
   let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}
  }
  // MT15:0671 flush is a no-op. Ready-MPU port bytes are returned here;
  // the explicit transport program owns hardware pacing in an output host.
  return {writes};
 }
 return {state,control,get driver(){return driver;},get markers(){return markers;},get timers(){return timers;},get voices(){return voices;},get lastNotes(){return lastNotes;},tick(sequenceEnabled=true){writes=[];const updated=stepOriginalMt32VoiceTimer({timers,voices,lastNotes},instrumentAt);({timers,voices,lastNotes}=updated);writes.push(...updated.writes);if(sequenceEnabled)stepOriginalMusicTimer(state,release,sequence);else release();return {writes};}};
}
