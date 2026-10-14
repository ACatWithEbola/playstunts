import {createTimedAudioBufferPump} from './timed-audio-buffer-pump.ts';
import {cancelAndHoldAudioParam} from './audio-param-automation.ts';
import {createScheduledAudioFrameMap} from './scheduled-audio-frame-map.ts';
/** Browser delivery for an owning timed Roland renderer. Transport and IRQ
 * sequencing remain in the renderer; this adapter never fabricates timing. */
export function createBrowserTimedMt32Audio(context:AudioContext,renderer:{
 sampleRate:number;render(frames:number):Promise<Float32Array>;
},active:()=>boolean,onScheduled?:(event:{start:number;duration:number;gap:number;frameStart:number;frameEnd:number;renderStartedAt:number;renderFinishedAt:number})=>void,warmupBuffers=0){
 if(!Number.isSafeInteger(warmupBuffers)||warmupBuffers<0||warmupBuffers>32)throw Error('Invalid Roland prebuffer count');
 if(!Number.isSafeInteger(renderer.sampleRate)||renderer.sampleRate<=0)throw Error('Invalid Roland sample rate');
 const gain=context.createGain(),sources=new Set<AudioBufferSourceNode>();
 const frameMap=createScheduledAudioFrameMap(renderer.sampleRate);
 gain.gain.value=1;gain.connect(context.destination);let closed=false,suspended=false,lastEnd:number|undefined;
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 let primed=false,renderEpoch=0,renderedFrames=0;const prebuffer:Float32Array[]=[];
 const frameRanges=new WeakMap<Float32Array,{start:number;end:number;renderStartedAt:number;renderFinishedAt:number}>();
 const renderBlock=async()=>{
  const start=renderedFrames,renderStartedAt=context.currentTime;renderedFrames+=512;
  const samples=await renderer.render(512);
  // Retain provenance even when a pending block is subsequently discarded.
  // Copy the wrapper buffer so a renderer reusing its array cannot alias ranges.
  const block=samples.slice();frameRanges.set(block,{start,end:start+512,renderStartedAt,renderFinishedAt:context.currentTime});return block;
 };
 const render=async()=>{
  const owner=renderEpoch;
  if(!primed){
   for(let i=0;i<warmupBuffers;i++){
    if(closed||!active())throw new DOMException('Roland prebuffer cancelled','AbortError');
    const block=await renderBlock();
    // Superseded pump drops this return value. Never retain its PCM for resume.
    if(owner!==renderEpoch)return block;
    prebuffer.push(block);
   }
   primed=true;
  }
  return prebuffer.shift()??renderBlock();
 };
 const pump=createTimedAudioBufferPump({now:()=>context.currentTime,duration:512/renderer.sampleRate,
  // Keep first-start lead unchanged while covering a delayed main-thread refill.
  // Fixed per-pump horizon; never chase rendering time or alter score timestamps.
  lookaheadSeconds:.15,
  active:()=>!closed&&!suspended&&active()&&context.state==='running',
  render,
  submit(samples,start){
   if(samples.length!==1024)throw Error('Roland synthesizer returned an incomplete stereo buffer');
   const buffer=context.createBuffer(2,512,renderer.sampleRate);
   for(let channel=0;channel<2;channel++){
    const values=buffer.getChannelData(channel);
    for(let i=0;i<512;i++)values[i]=samples[i*2+channel];
   }
   const source=context.createBufferSource();source.buffer=buffer;
   try{source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);const duration=512/renderer.sampleRate,range=frameRanges.get(samples);if(!range)throw Error('Roland buffer sample provenance missing');frameMap.discardBefore(context.currentTime);frameMap.add({frameStart:range.start,frameEnd:range.end,start});onScheduled?.({start,duration,gap:lastEnd===undefined?0:Math.max(0,start-lastEnd),frameStart:range.start,frameEnd:range.end,renderStartedAt:range.renderStartedAt,renderFinishedAt:range.renderFinishedAt});lastEnd=start+duration;}
   catch(error){release(source);throw error;}
  }});
 return {pump:()=>pump.pump(),playbackTimeForFrame:(frame:number)=>frameMap.time(frame),retainPlaybackFrame:(frame:number)=>frameMap.retain(frame),
  suspend(){if(closed||suspended)return;suspended=true;renderEpoch++;primed=false;prebuffer.length=0;lastEnd=undefined;frameMap.clear();pump.reset();for(const source of sources)release(source);},
  resume(){if(closed||!suspended)return;suspended=false;pump.reset();},
  setVolume(value:number,at=context.currentTime,fade=0){
   if(!Number.isFinite(value)||value<0||value>1||!Number.isFinite(at)||!Number.isFinite(fade)||fade<0)throw Error('Invalid playback volume');
   if(closed)return;cancelAndHoldAudioParam(gain.gain,at);
   if(fade>0)gain.gain.linearRampToValueAtTime(value,at+fade);else gain.gain.setValueAtTime(value,at);
  },
  close(){if(closed)return;closed=true;renderEpoch++;prebuffer.length=0;frameMap.clear();pump.reset();for(const source of sources)release(source);gain.disconnect();},
 };
}
