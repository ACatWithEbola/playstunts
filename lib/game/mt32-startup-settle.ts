/** Advance a silent device until Munt has consumed its initialization queue.
 * This is a readiness check, not a model of the original PC's I/O delay loops.
 * Use only before playback: active notes and reverb also count as activity. */
export async function settleMt32Startup(output:{sampleRate:number;active():boolean;render(frames:number):Float32Array},cancelled:()=>boolean,yieldTask:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,0))){
 const limit=Math.ceil(output.sampleRate*10);let frames=0;
 if(!Number.isFinite(limit)||limit<=0)throw Error('Invalid Roland sample rate');
 while(true){
  if(cancelled())throw new DOMException('Roland startup cancelled','AbortError');
  if(!output.active())return frames;
  if(frames>=limit)throw Error('Roland initialization did not become ready');
  const count=Math.min(512,limit-frames);output.render(count);frames+=count;
  if(frames%4096===0)await yieldTask();
 }
}
