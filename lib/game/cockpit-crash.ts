export interface CockpitCrashArt {lines:number[][];frames:number[]}
/** Original windshield crack calls at f1d2..f3ac, including the two black
 * outline strokes. Vertical coordinates scale to the original viewport height.
 */
export function cockpitCrashLines(art:CockpitCrashArt,elapsed:number,top:number,height:number,color:number){
 const signed=(n:number)=>n<<16>>16;
 const frame=Math.trunc(signed(elapsed)/2);
 if(frame<0||!art.frames.length)throw Error('Original crack timeline requires unavailable resource memory');
 const count=art.frames[Math.min(frame,art.frames.length-1)];
 if(count<0||count>art.lines.length)throw Error('Original crack line resource is incomplete');
 const lines:number[][]=[];
 for(const [x0,y0,x1,y1] of art.lines.slice(0,count)){
  const first=signed(Math.trunc(signed(height)*y0/200)+top),second=signed(Math.trunc(signed(height)*y1/200)+top);
  lines.push([x0,signed(first-1),x1,signed(second-1),0],[x0,signed(first+1),x1,signed(second+1),0],[x0,first,x1,second,color]);
 }
 return lines;
}
/** Original water fill f15c..f1d1: rises from the viewport bottom over 80 ticks. */
export function cockpitWaterRectangle(elapsed:number,top:number,height:number){
 const signed=(n:number)=>n<<16>>16;
 const fill=signed(Math.trunc(Math.min(signed(elapsed),80)*signed(height)/80));
 const bottom=signed(top+height);
 return {left:0,right:320,top:signed(bottom-fill),bottom};
}
