/** Bounded asynchronous audio scheduling. Rendering may await original device
 * transport, but a pump never chases a moving browser deadline or overlaps
 * another pump. The caller owns stream/device lifetime and actual transport. */
export function createTimedAudioBufferPump<T>(host:{
 now():number;duration:number;active():boolean;lookaheadSeconds?:number;
 render():Promise<T>;submit(buffer:T,start:number):void;
}){
 if(!Number.isFinite(host.duration)||host.duration<=0)throw Error('Invalid audio buffer duration');
 const lookahead=host.lookaheadSeconds??.09;
 if(!Number.isFinite(lookahead)||lookahead<.03||lookahead>.25)throw Error('Invalid bounded audio lookahead');
 let next=0,pending:Promise<void>|undefined,failed=false,generation=0,lastClock=0;
 return {reset(){generation++;next=0;},pump():Promise<void>{
  if(pending)return pending;
  if(failed)return Promise.reject(Error('Timed audio pump failed'));
  if(!host.active())return Promise.resolve();
  const now=host.now();
  if(!Number.isFinite(now)||now<lastClock)return Promise.reject(Error('Invalid audio clock'));
  lastClock=now;
  const owner=generation,newTimeline=next===0;let deadline=now+lookahead,firstSubmission=true;if(next<=now)next=now+0.015;
  pending=(async()=>{
   try{
    while(owner===generation&&next<deadline&&host.active()){
     const buffer=await host.render();
     // A closed/superseded device must never schedule the completed buffer.
     if(owner!==generation||!host.active())return;
     const current=host.now();
     if(!Number.isFinite(current)||current<lastClock)throw Error('Invalid audio clock');
     lastClock=current;
     // An already future deadline remains safe: adding the startup lead again
     // after every async render inserts gaps between otherwise contiguous PCM.
     const start=next>current?next:current+0.015;
     host.submit(buffer,start);next=start+host.duration;
     // Initial warmup can consume the original batch deadline before any
     // sound is queued. Anchor its intended runway once to the actual first
     // submission, never chase later renders/refills with a moving deadline.
     if(newTimeline&&firstSubmission)deadline=Math.max(deadline,start+lookahead-.015);
     firstSubmission=false;
    }
   }catch(error){failed=true;throw error;}
  })().finally(()=>{pending=undefined;});
  return pending;
 }};
}
