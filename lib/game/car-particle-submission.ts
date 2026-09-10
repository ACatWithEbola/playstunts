import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import type {Particle} from './particles.ts';
import type {Vector} from '../physics/math.ts';
import {placePlayerParticle,placeOpponentParticle} from './particle-placement.ts';
/** Supplied D4BC..D5C7 / D72D..D839: owner paint and masked car depth bias. */
export function originalCarParticleSubmission(memory:Uint8Array,d:number,p:Particle,car:Vector,camera:Vector,bias:number,tileMask:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const placement=p.owner===1?placeOpponentParticle(p,car,camera):placePlayerParticle(p,car,camera);
 const data=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),record=new Uint8Array(20),out=new DataView(record.buffer);
 const pointer=data.getUint16(d+0x2ce4+p.style*14+4,true);
 [...placement.position,pointer,layout.address(0x902a),...placement.rotation,0x400].forEach((n,i)=>out.setUint16(i*2,n,true));
 record[18]=5;record[19]=memory[d+layout.address(p.owner===1?0x8fcd:0x8fc6)];
 return {mode:'queued' as const,record:Array.from(record),depthBias:(bias&tileMask)<<16>>16,tag:0};
}
