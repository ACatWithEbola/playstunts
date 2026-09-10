import {placeSignParticle} from './particle-placement.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
/** Supplied D1F2..D35F: ascending scan of the shared 24 particle slots. */
export function selectOriginalSignParticles(particles:readonly Particle[],signIndex:number){
 if(particles.length!==24)throw Error('Original particle pool has 24 slots');
 const owner=(signIndex<<24>>24)+2;
 return particles.flatMap((p,index)=>(p.speed&65535)!==0&&(p.owner&255)===owner?[index]:[]);
}

export function prepareOriginalSignParticles(particles:readonly Particle[],signIndex:number,anchor:Vector,camera:Vector){
 return selectOriginalSignParticles(particles,signIndex).map(index=>({index,...placeSignParticle(particles[index],anchor,camera)}));
}
