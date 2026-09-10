import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {selectOriginalTrackSign} from './select-track-sign.ts';
import {originalTrackSignSubmission} from './track-sign-submission.ts';
import {originalSignParticleSubmissions} from './sign-particle-submissions.ts';
import type {Particle} from './particles.ts';
import type {Vector} from '../physics/math.ts';
/** Sign submissions belong after static roads and before car submissions. */
export function prepareOriginalTrackSign(memory:Uint8Array,d:number,column:number,row:number,particles:readonly Particle[],camera:Vector,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const selected=selectOriginalTrackSign(memory,d,column,row,layout);
 if(selected.mode==='none')return [];
 if(selected.mode==='intact')return [originalTrackSignSubmission(memory,d,selected.index,camera,layout)];
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),index=selected.index<<24>>24;
 const segment=v.getUint16(d+layout.address(0x70e2),true)*16,offset=v.getUint16(d+layout.address(0x70e0),true);
 const anchor=[0,1,2].map(axis=>v.getInt16(segment+((offset+index*6+axis*2)&65535),true)) as Vector;
 return originalSignParticleSubmissions(memory,d,particles,selected.index,anchor,camera,layout);
}
