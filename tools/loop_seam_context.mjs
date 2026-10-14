/** Offline PCM context blend; no duration or MIDI-event edits. */
import assert from 'node:assert/strict';
export function conditionLoopSeam(input,rate,startSeconds,endSeconds,fadeFrames){
 assert.ok(input instanceof Float32Array&&input.length%2===0);
 assert.ok(Number.isSafeInteger(rate)&&rate>=8000&&rate<=192000);
 assert.ok(Number.isFinite(startSeconds)&&Number.isFinite(endSeconds));
 assert.ok(Number.isSafeInteger(fadeFrames)&&fadeFrames>=2&&fadeFrames<=rate*.02);
 const snap=v=>Math.abs(v-Math.round(v))<1e-6?Math.round(v):v;
 const start=snap(startSeconds*rate),end=snap(endSeconds*rate),a=Math.floor(start),b=Math.floor(end);
 assert.ok(a>=fadeFrames&&b+1<input.length/2&&b>a+fadeFrames);
 assert.ok(Math.abs((end-start)-Math.round(end-start))<1e-6,'Loop endpoints must share sample phase');
 assert.ok(input.every(Number.isFinite));
 const output=input.slice();
 for(let offset=-fadeFrames;offset<=1;offset++){
  // The last two samples must fully match start context, including when
  // WebAudio interpolates a half-sample loop endpoint.
  const gain=Math.min(1,(offset+fadeFrames)/(fadeFrames-1));
  for(let ch=0;ch<2;ch++)output[(b+offset)*2+ch]=input[(b+offset)*2+ch]*(1-gain)+input[(a+offset)*2+ch]*gain;
 }
 return {output,firstEditedFrame:b-fadeFrames,lastEditedFrame:b+1,loopStartFrame:start,loopEndFrame:end,fadeFrames};
}
