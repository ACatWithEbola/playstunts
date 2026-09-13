export interface FramePerformanceSnapshot {
 currentFps:number;
 averageFps:number;
 low1Fps:number;
 frameCount:number;
}

const CURRENT_WINDOW_MS=1000;
const MAX_TRACKED_INTERVALS=3600;
const MAX_CONTINUOUS_INTERVAL_MS=2000;

/** Measures only completed enhanced-renderer frames. Long inactive gaps are
 * excluded so changing tabs does not masquerade as a rendering slowdown. */
export function createFramePerformanceCounter(){
 let previous:number|undefined,totalDuration=0,totalIntervals=0;
 let recent:{at:number;duration:number}[]=[];
 const tracked:number[]=[];
 const reset=()=>{previous=undefined;totalDuration=0;totalIntervals=0;recent=[];tracked.length=0;};
 const pause=()=>{previous=undefined;recent=[];};
 const frame=(at:number)=>{
  if(!Number.isFinite(at))return;
  if(previous===undefined){previous=at;return;}
  const duration=at-previous;previous=at;
  if(duration<=0||duration>MAX_CONTINUOUS_INTERVAL_MS){recent=[];return;}
  totalDuration+=duration;totalIntervals++;
  recent.push({at,duration});
  while(recent.length&&at-recent[0].at>CURRENT_WINDOW_MS)recent.shift();
  tracked.push(duration);if(tracked.length>MAX_TRACKED_INTERVALS)tracked.shift();
 };
 const snapshot=():FramePerformanceSnapshot|undefined=>{
  if(!totalIntervals||!recent.length||!tracked.length)return;
  const recentDuration=recent.reduce((sum,sample)=>sum+sample.duration,0);
  const slowestCount=Math.max(1,Math.floor(tracked.length*.01));
  const slowest=[...tracked].sort((a,b)=>b-a).slice(0,slowestCount);
  const slowestDuration=slowest.reduce((sum,duration)=>sum+duration,0)/slowest.length;
  return {currentFps:recent.length*1000/recentDuration,averageFps:totalIntervals*1000/totalDuration,low1Fps:1000/slowestDuration,frameCount:totalIntervals};
 };
 return {frame,snapshot,reset,pause};
}
