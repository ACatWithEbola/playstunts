import {originalReplayScrubStep} from './replay-scrub-step.ts';
export interface NativeReplayScrubHost {
 memory():Uint8Array;pauseAudio():void;control(mode:number,start:number,current:number):void;
 counter():number;input(delay:number):Promise<number>;
 prepareSeek(target:number):void;simulate(incomingSI:number):void;waitMessage():void;
}
/** Original164f2..1685b held seek lifecycle. Checkpoint restoration and
 * simulation stay separate so the original progress drawing order survives. */
export async function scrubNativeReplay(host:NativeReplayScrubHost,d:number,direction:'forward'|'backward'){
 const word=(o:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+o,true);};
 const write=(o:number,n:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+o,n,true);};
 const s16=(n:number)=>n<<16>>16;
 host.memory()[d+0x9aca]=1;host.pauseAudio();host.control(2,direction==='forward'?0:1,0);host.counter();
 let accumulator=20;
 while(host.memory()[d+0x9ad4]&0x30){
  const step=originalReplayScrubStep(accumulator,host.counter(),word(0x8fd8),word(0x73b2),direction);accumulator=step.accumulator;
  host.control(1,word(0x8c26),step.target);await host.input(step.delay);
 }
 const distance=Math.max(0,s16(Math.trunc(accumulator/20)));
 if(direction==='forward'){
  let target=(word(0x73b2)+distance)&65535;
  if(s16(word(0x8fd8))<s16(target))target=word(0x8fd8);
  host.prepareSeek(target);write(0x73b2,target);host.control(2,4,0);host.waitMessage();
  while(word(0x8c26)!==word(0x73b2)){
   host.simulate(target);host.control(1,word(0x8c26),word(0x73b2));await host.input(1);
  }
 }else{
  host.control(2,4,0);
  // A quick click can leave the original one-frame accumulator intact even
  // when the replay is already at frame zero. Clamp it to the available
  // history so the beginning control is a harmless no-op, not a wrapped
  // request for frame 65535.
  const backwardDistance=Math.min(distance,word(0x73b2));
  if(backwardDistance!==0){
   host.waitMessage();const target=word(0x73b2)-backwardDistance;
   host.prepareSeek(target);write(0x73b2,target);
   const total=(target-word(0x8c26))&65535;let remaining=total;
   while(word(0x8c26)!==word(0x73b2)){
    host.simulate(remaining);remaining=(remaining-1)&65535;
    const progress=Math.trunc(s16(remaining)*backwardDistance/s16(total));
    host.control(1,(progress+word(0x73b2))&65535,word(0x73b2));await host.input(1);
   }
  }
  host.control(1,word(0x8c26),word(0x8c26));
 }
 await host.input(1000);
}
