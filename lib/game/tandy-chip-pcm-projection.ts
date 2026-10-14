/** Zero-order hold projection from completed integer chip-time events onto
 * audio sampling points. Caller must supply covered hardware time. This does
 * not advance CPU/device time or deliver interrupts to manufacture coverage. */
export function createTandyChipPcmProjection(sampleRate:number,clockHz:number,initialLevel:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||!Number.isSafeInteger(clockHz)||clockHz<1||!Number.isFinite(Math.fround(initialLevel)))throw Error('Invalid Tandy PCM projection profile');
 const events:Array<{tick:number;level:number}>=[];
 let cursor=0,lastTick=0,lastSampleTick=-1,level=initialLevel,closed=false;
 const healthy=()=>{if(closed)throw Error('Tandy PCM projection closed');};
 const tickAt=(frame:number)=>{const product=frame*clockHz;if(!Number.isSafeInteger(product))throw Error('Tandy PCM projection timeline overflow');return Math.floor(product/sampleRate);};
 return {
  record(tick:number,nextLevel:number){healthy();if(!Number.isSafeInteger(tick)||tick<0||tick<lastTick||tick<=lastSampleTick||!Number.isFinite(Math.fround(nextLevel)))throw Error('Invalid Tandy PCM event position/level');events.push({tick,level:nextLevel});lastTick=tick;},
  render(frames:number,coveredTick:number){
   healthy();if(!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames)||!Number.isSafeInteger(coveredTick)||coveredTick<0)throw Error('Invalid Tandy PCM render span');
   const last=frames?tickAt(cursor+frames-1):lastSampleTick;if(last>coveredTick)throw Error('Tandy hardware timeline does not cover audio output');
   const pcm=new Float32Array(frames);let consumed=0;
   for(let index=0;index<frames;index++){const tick=tickAt(cursor+index);while(consumed<events.length&&events[consumed].tick<=tick)level=events[consumed++].level;pcm[index]=level;lastSampleTick=tick;}
   events.splice(0,consumed);cursor+=frames;return pcm;
  },
  snapshot:()=>({cursor,lastTick,lastSampleTick,level,pending:events.length}),
  close(){closed=true;events.length=0;},
 };
}
