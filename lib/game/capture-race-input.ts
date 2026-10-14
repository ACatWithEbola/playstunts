import {requestOriginalRaceReplay} from './request-race-replay.ts';
import {raceSnapshotSize} from './versioned-race-snapshot.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original14599..146d3 after the caller has selected an input byte. The
 *12000-frame buffer slides by600 frames; total time may reach30000 ticks.
 * The limit applies original player cause4 before setting completion. */
export function captureOriginalRaceInput(memory:Uint8Array,d:number,input:number,framesPerSecond:10|20=20,engine?:PhysicsEngineVersion){
 const chunk=30*framesPerSecond;
 const snapshotSize=raceSnapshotSize(engine);
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(offset:number)=>v.getUint16(d+offset,true),put=(offset:number,value:number)=>v.setUint16(d+offset,value&65535,true);
 const count=word(0x73b2),adjustment=word(0xa034);
 if(((count+adjustment)&65535)>=1500*framesPerSecond){requestOriginalRaceReplay(memory,d);memory[d+0x8ff4]=1;return {action:'limit' as const,recorded:false};}
 if(count===12000){
  if(adjustment===0&&memory[d+0xa34e]===0){memory[d+0xa34e]=1;memory[d+0xaa77]=1;return {action:'continue-prompt' as const,recorded:false};}
  const checkpointOffset=word(0xa030),checkpointSegment=word(0xa032);
  const pointer=(offset:number)=>({offset:offset&65535,segment:(checkpointSegment+((offset>>>16)<<12))&65535});
  for(let i=0;i<12000/chunk-1;i++){
   const frame=pointer(checkpointOffset+(i+1)*snapshotSize+0x140),address=frame.segment*16+frame.offset;v.setUint16(address,(v.getUint16(address,true)-chunk)&65535,true);
   const source=pointer(checkpointOffset+(i+1)*snapshotSize),target=pointer(checkpointOffset+i*snapshotSize);
   for(let byte=0;byte<snapshotSize;byte+=2)v.setUint16(target.segment*16+((target.offset+byte)&65535),v.getUint16(source.segment*16+((source.offset+byte)&65535),true),true);
  }
  const offset=word(0x9c40),segment=word(0x9c42)*16;
  for(let i=0;i<12000-chunk;i++)memory[segment+((offset+i)&65535)]=memory[segment+((offset+i+chunk)&65535)];
  put(0x73b2,word(0x73b2)-chunk);put(0x8fd8,word(0x8fd8)-chunk);put(0xa034,adjustment+chunk);put(0x8c26,word(0x8c26)-chunk);
 }
 const next=word(0x73b2);put(0x73b2,next+1);memory[word(0x9c42)*16+((word(0x9c40)+next)&65535)]=input&255;put(0x8fd8,word(0x8fd8)+1);
 return {action:'record' as const,recorded:true};
}
