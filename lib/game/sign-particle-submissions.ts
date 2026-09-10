import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import type {Particle} from './particles.ts';
import type {Vector} from '../physics/math.ts';
import {selectOriginalSignParticles} from './sign-particle-selection.ts';
import {placeSignParticle} from './particle-placement.ts';
/** Original selected sign fragments become queued records with flags 5. */
export function originalSignParticleSubmissions(memory:Uint8Array,d:number,particles:readonly Particle[],signIndex:number,anchor:Vector,camera:Vector,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const data=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return selectOriginalSignParticles(particles,signIndex).map(index=>{
  const p=particles[index],placement=placeSignParticle(p,anchor,camera),record=new Uint8Array(20),v=new DataView(record.buffer);
  const pointer=data.getUint16(d+0x2ce4+p.style*14+4,true);
  [...placement.position,pointer,layout.address(0x902a),...placement.rotation,0x400].forEach((n,i)=>v.setUint16(i*2,n,true));record[18]=5;
  return {mode:'queued' as const,record:Array.from(record),depthBias:0};
 });
}
