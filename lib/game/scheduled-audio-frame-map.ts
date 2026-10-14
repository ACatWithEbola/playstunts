/** Maps only submitted PCM frames to their WebAudio playback times.
 * Gaps from cancelled renders are deliberately not interpolated. */
export function createScheduledAudioFrameMap(sampleRate:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<=0)throw Error('Invalid audio sample rate');
 const ranges:{frameStart:number;frameEnd:number;start:number}[]=[];
 const pins=new Set<{frame:number}>();
 // Expiring lookup entries must not erase the submission-order invariant.
 let submittedEnd:{frame:number;time:number}|undefined;
 return {
  retain(frame:number){
   if(!Number.isSafeInteger(frame)||frame<0)throw Error('Invalid retained audio frame');
   const pin={frame};pins.add(pin);return()=>{pins.delete(pin);};
  },
  add(range:{frameStart:number;frameEnd:number;start:number}){
   const {frameStart,frameEnd,start}=range;
   if(!Number.isSafeInteger(frameStart)||!Number.isSafeInteger(frameEnd)||frameStart<0||frameEnd<=frameStart||!Number.isFinite(start)||start<0)throw Error('Invalid scheduled audio frame range');
   if(submittedEnd&&(frameStart<submittedEnd.frame||start<submittedEnd.time-1e-9))throw Error('Overlapping scheduled audio frame range');
   ranges.push({...range});
   submittedEnd={frame:frameEnd,time:start+(frameEnd-frameStart)/sampleRate};
  },
  time(frame:number){
   if(!Number.isSafeInteger(frame)||frame<0)throw Error('Invalid audio frame position');
   // Endpoints belong to the next block: a delayed next block can have a gap.
   const range=ranges.find(range=>frame>=range.frameStart&&frame<range.frameEnd);
   return range?range.start+(frame-range.frameStart)/sampleRate:undefined;
  },
  discardBefore(time:number){
   if(!Number.isFinite(time)||time<0)throw Error('Invalid audio expiry time');
   for(let i=ranges.length-1;i>=0;i--){const range=ranges[i];if(range.start+(range.frameEnd-range.frameStart)/sampleRate<=time&&![...pins].some(pin=>pin.frame>=range.frameStart&&pin.frame<range.frameEnd))ranges.splice(i,1);}
  },
  clear(){ranges.length=0;pins.clear();submittedEnd=undefined;},
 };
}
