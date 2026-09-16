import type {OriginalMenuAudioEffect} from './menu-audio-control.ts';
import {applyMusicSequenceControl} from './music-sequence-control.ts';
import {applyOriginalTandyTrackControl,stopOriginalTandyTrack} from './tandy-track-control.ts';
import {setOriginalTandyVolume} from './tandy-control.ts';
import {updateOriginalTandyVoice,type OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {startOriginalTandyAllocatedNote} from './tandy-note-start.ts';
import {stepOriginalTandyVoiceTimer} from './tandy-voice-timer.ts';
import type {OriginalMusicSeed} from './music-runtime.ts';
import {readSoundCommand} from './sound-command.ts';
import {stepOriginalMusicTimer} from './music-timer.ts';
import {stepVoiceDuration} from './voice-duration.ts';
export interface OriginalTandyMusicSeed extends OriginalMusicSeed {driver:number[];port61:number;}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
/** Original music command execution for the supplied TITL, SLCT, VICT and OVER scores.
 * The seed is the original loader's initialized state; playback is native. */
export function createOriginalTandyMusicRuntime(seed:OriginalTandyMusicSeed){
 const bank=Uint8Array.from(seed.bank),patches=Uint8Array.from(seed.voices),header=seed.header;
 let timers=seed.timers.map(t=>Uint8Array.from(t)),voices=seed.hardware.map(t=>Uint8Array.from(t)),lastNotes=Uint8Array.from(seed.lastNotes);
 let commandArgument=seed.commandArgument??0,driver=Uint8Array.from(seed.driver),port61=seed.port61;
 const markers=Uint8Array.from(seed.markers??Array(24).fill(0));
 const state={masterVolume:seed.masterVolume??127,accumulator:0,interval:128,tracks:bank[header+7+bank[header+6]*4]};
 const instrumentAt=(offset:number,segment:number)=>{if(segment!==0x9000)throw Error('Invalid original music instrument segment');return patches.slice(offset,offset+100);};
 let writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 function stopTrack(owner:number){const stopped=stopOriginalTandyTrack(driver,timers,voices,owner,0x39e1,port61);bios.push(...stopped.bios);port61=stopped.port61;return stopped.writes;}
 function release(){for(let i=0;i<voices.length;i++){const v=voices[i];if(!v[1]||v[0]>=16)continue;const next=stepVoiceDuration(v,timers[v[0]][0x25]);voices[i]=next.record;}}
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
    const next=startOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner,instrument,instrumentPointer:{offset,segment},timers,voices,lastNotes,command},driver,0x39e1,port61);
    ({timers,voices,lastNotes,driver}=next);writes.push(...next.writes);bios.push(...next.bios);for(const [port,value] of next.writes)if(port===0x61)port61=value;timer=timers[owner];v=view(timer);
   }else if(op===0xd9){
    if(timer[4]){const p=5+timer[4]*4;v.setUint32(0,v.getUint32(p,true),true);timer[4]--;}
    else{v.setUint32(0,0,true);writes.push(...stopTrack(owner));}
   }else if(op===0xda)writes.push(...resetTrack(owner));
   else if(applyMusicSequenceControl(timer,op,arg,c.duration??0)){}
   else if(op===0xdc){const at=header+7+arg*4;v.setUint32(0x1e,view(bank).getUint32(at,true),true);}
   else if(op===0xdd){if(!arg)throw Error('Original score specifies zero tempo');state.interval=Math.floor(32000/arg);}
   else if(op===0xde){timer[0x28]=arg;for(let i=0;i<voices.length;i++)if(voices[i][0]===owner)setOriginalTandyVolume(driver,i,arg);}
   else if(op===0xdf)applyOriginalTandyTrackControl(driver,timers,voices,owner,arg,c.duration??0);
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
 function resetTrack(owner:number){
  const result=stopTrack(owner),timer=timers[owner],v=view(timer);
  for(const [at,value] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,state.masterVolume],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[at]=value;
  for(const at of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(at,0,true);lastNotes[owner]=0;markers[owner]=0;return result;
 }
 function control(effect:OriginalMenuAudioEffect,incomingCx:number){
  let cx=incomingCx&65535;const output:number[][]=[],requests:OriginalTandyBiosSound[]=[];
  if(effect.type==='volume'){timers[effect.owner][0x28]=effect.value;for(let i=0;i<voices.length;i++)if(voices[i][0]===effect.owner)setOriginalTandyVolume(driver,i,effect.value);cx=voices.length;}
  else if(effect.type==='update-voice'){const voice=voices[effect.index];if(voice?.[1]&&voice[44]){const rv=view(voice),timer=timers[(rv.getUint16(42,true)-0x801e)/72];const updated=updateOriginalTandyVoice(driver,0x39e1,voice[44],voice,timer,instrumentAt(rv.getUint16(16,true),rv.getUint16(18,true)),cx,port61);cx=updated.cx;output.push(...updated.writes);requests.push(...updated.bios);}}
  else if(effect.type==='stop-tracks'){const stopped=stopOriginalTandyTrack(driver,timers,voices,effect.first,0x39e1,port61,effect.last);output.push(...stopped.writes);requests.push(...stopped.bios);port61=stopped.port61;cx=0;}
  else if(effect.type==='master-volume')throw Error('Alternate driver volume is not TD15');
  // TD15:AE2 flush is a no-op.
  for(const [port,value] of output)if(port===0x61)port61=value;return {writes:output,bios:requests,cx};
 }
 /** The interrupted caller's CX remains explicit because TD15's noise-table
  * branch reads it. This runtime does not invent the surrounding CPU state. */
 return {state,control,get driver(){return driver;},get port61(){return port61;},get markers(){return markers;},get timers(){return timers;},get voices(){return voices;},get lastNotes(){return lastNotes;},tick(incomingCx:number,sequenceEnabled=true){writes=[];bios=[];const updated=stepOriginalTandyVoiceTimer({timers,voices,lastNotes,driver,cx:incomingCx},instrumentAt,0x39e1,port61);({timers,voices,lastNotes,driver,port61}=updated);writes.push(...updated.writes);bios.push(...updated.bios);if(sequenceEnabled)stepOriginalMusicTimer(state,release,sequence);else release();return {writes,bios};}};
}
