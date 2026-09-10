'use client';
import {useEffect,useRef} from 'react';
import art from '@/public/game/cockpit/crash.json';
import {cockpitCrashLines,cockpitWaterRectangle} from '@/lib/game/cockpit-crash';

/** Original crack artwork/timeline on the same proportional surface as the dashboard. */
export default function CockpitCrash({crash,elapsed}:{crash:number;elapsed:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const context=ref.current?.getContext('2d');if(!context)return;
  context.clearRect(0,0,320,200);
  context.save();context.beginPath();context.rect(0,0,320,130);context.clip();
  if(crash===1){
   context.lineWidth=1;context.lineCap='butt';
   for(const [x0,y0,x1,y1,color] of cockpitCrashLines(art,elapsed,0,130,15)){
    context.strokeStyle=color===0?'#000':'#fcfcfc';
    context.beginPath();context.moveTo(x0+0.5,y0+0.5);context.lineTo(x1+0.5,y1+0.5);context.stroke();
   }
  }else if(crash===2){
   const rectangle=cockpitWaterRectangle(elapsed,0,130);
   context.fillStyle='#0080d0';context.fillRect(rectangle.left,rectangle.top,rectangle.right-rectangle.left,rectangle.bottom-rectangle.top);
  }
  context.restore();
 },[crash,elapsed]);
 return <canvas ref={ref} className="cockpit-crash" width={320} height={200} aria-hidden="true"/>;
}
