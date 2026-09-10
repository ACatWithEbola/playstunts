import {restoreOriginalPcSpeakerSampleTimer} from './pc-speaker-sample.ts';
/** Original2A66E with PC15: every controller calls the no-op entry15.
 * Sustain64 still retains its byte and release behavior in the game sequencer. */
export function applyOriginalPcSpeakerTrackControl(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,control:number,value:number){
 const timer=timers[owner];control&=255;value&=65535;if(control===64)timer[0x25]=value&255;
 for(let i=0;i<voices.length;i++){const voice=voices[i];if(voice[0]!==timer[0x23])continue;if(control===64&&!value&&voice[1]===2)voice[22]=4;}
}
/** Original2B4D8 invokes PC15 stop on every owned record, active or not. */
export function stopOriginalPcSpeakerTrack(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,lastOwner=owner){
 const writes:number[][]=[];let restoreVector:{offset:number;segment:number}|undefined;
 for(let i=0;i<voices.length;i++){
  const voice=voices[i];if(voice[0]<owner||voice[0]>lastOwner)continue;if(!i){const result=restoreOriginalPcSpeakerSampleTimer(driver);writes.push(...result.writes);restoreVector=result.restoreVector;}driver[0x1a8+i]=0;
  voice[0]=255;voice[1]=0;voice[2]=0;new DataView(voice.buffer,voice.byteOffset,voice.byteLength).setUint32(16,0,true);
 }
 for(let i=owner;i<=lastOwner;i++)timers[i][0x15]=0;return {writes,...(restoreVector?{restoreVector}:{})};
}
