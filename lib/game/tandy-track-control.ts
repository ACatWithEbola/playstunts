import {runOriginalTandyChannelStop} from './tandy-lifecycle.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {controlOriginalTandyChannel,originalTandyVolumeGateWrites} from './tandy-control.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original2A66E retains sustain in the game and forwards each owned voice's
 * controller to TD15, including inactive records. TD15 handles controller7. */
export function applyOriginalTandyTrackControl(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,control:number,value:number,generation?:PhysicsEngineVersion,port61?:number){
 const writes:number[][]=[];
 const timer=timers[owner];control&=255;value&=65535;if(control===64)timer[0x25]=value&255;
 for(let i=0;i<voices.length;i++){const voice=voices[i];if(voice[0]!==timer[0x23])continue;
  if(control===7&&generation==='ms-1991'&&i===5&&((value&255)>>>3)===0){
   if(port61===undefined)throw Error('Modern Tandy volume gate requires current port61');
   const gated=originalTandyVolumeGateWrites(i,value,port61,generation);writes.push(...gated);port61=gated[0][1];
  }
  controlOriginalTandyChannel(driver,i,control,value,generation);if(control===64&&!value&&voice[1]===2)voice[22]=4;
 }
 return {writes,port61};
}

/** Original2B4D8 stops every owned record, including inactive sample/PC slots. */
export function stopOriginalTandyTrack(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,driverSegment:number,port61:number,lastOwner=owner,generation?:PhysicsEngineVersion){
 const program=runOriginalTandyTrackStop(driver,timers,voices,owner,driverSegment,port61,lastOwner,generation);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyTrackStop(driver:Uint8Array,timers:Uint8Array[],voices:Uint8Array[],owner:number,driverSegment:number,port61:number,lastOwner=owner,generation?:PhysicsEngineVersion,deferBios=false):Generator<{driver:Uint8Array;timers:Uint8Array[];voices:Uint8Array[];writes:number[][];bios:OriginalTandyBiosSound[];port61:number},{writes:number[][];bios:OriginalTandyBiosSound[];port61:number},{driver:Uint8Array;port61:number}|undefined>{
 const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 for(let i=0;i<voices.length;i++){
  const voice=voices[i];if(voice[0]<owner||voice[0]>lastOwner)continue;
  const program=runOriginalTandyChannelStop(driver,driverSegment,i,port61,generation,deferBios);let step=program.next(),emittedBios=0;
  try{while(!step.done){
   bios.push(...step.value.bios);emittedBios+=step.value.bios.length;
   const resumed=yield {driver,timers,voices,writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61};
   if(resumed){if(!Number.isInteger(resumed.port61)||resumed.port61<0||resumed.port61>255)throw Error('Invalid resumed Tandy track port');port61=resumed.port61;}
   step=program.next(resumed?.driver);
  }
  const stopped=step.value;writes.push(...stopped.writes);bios.push(...stopped.bios.slice(emittedBios));for(const [port,value] of stopped.writes)if(port===0x61)port61=value;
  }finally{program.return(undefined as never);}
  voice[0]=255;voice[1]=voice[2]=0;new DataView(voice.buffer,voice.byteOffset,voice.byteLength).setUint32(16,0,true);
 }
 for(let i=owner;i<=lastOwner;i++)timers[i][0x15]=0;return {writes,bios,port61};
}
