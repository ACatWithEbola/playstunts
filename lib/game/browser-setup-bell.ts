import {createOriginalPcSpeakerAudio} from './pc-speaker-audio.ts';
/** SETUP0AAE issues DOS character7. Reference wdosbox function1552 programs
 * PIT2 with B6/28/05, enables speaker bits0..1 and waits333ms. Hardware output
 * uses our existing native PIT/speaker renderer, not a canned sound effect. */
export async function playBrowserSetupBell(context:AudioContext,signal:AbortSignal){
 if(signal.aborted)throw new DOMException('Native SETUP closed','AbortError');
 const speaker=createOriginalPcSpeakerAudio(context.sampleRate);for(const [port,value] of [[0x43,0xb6],[0x42,0x28],[0x42,0x05],[0x61,3]])speaker.write(port,value);
 const samples=Math.round(context.sampleRate*.333),buffer=context.createBuffer(1,samples,context.sampleRate);buffer.copyToChannel(speaker.render(samples),0);speaker.write(0x61,0);
 const source=context.createBufferSource(),gain=context.createGain();gain.gain.value=.6;gain.connect(context.destination);source.buffer=buffer;source.connect(gain);
 await new Promise<void>((resolve,reject)=>{let done=false;const finish=(aborted=false)=>{if(done)return;done=true;signal.removeEventListener('abort',abort);source.onended=null;try{source.stop();}catch{}source.disconnect();gain.disconnect();source.buffer=null;if(aborted)reject(new DOMException('Native SETUP closed','AbortError'));else resolve();};const abort=()=>finish(true);signal.addEventListener('abort',abort,{once:true});source.onended=()=>finish();source.start();});
}
