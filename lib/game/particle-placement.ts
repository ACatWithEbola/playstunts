import {i16,type Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
/** Player debris render record, original loaded 0xd4bc-0xd5af.
 * Positions are whole original world units relative to the original camera.
 */
export function placePlayerParticle(p:Particle,car:Vector,camera:Vector){
 if(p.owner!==0 || p.style<4 || p.style>7)throw Error('Player debris placement requires original player styles 4-7');
 return {shape:`exp${p.style-4}`,position:[p.x,p.y,p.z].map((n,a)=>i16(((n+car[a])|0)>>6)-camera[a]).map(i16) as Vector,rotation:[i16(-p.angleX),i16(-p.angleZ),i16(-p.heading)] as Vector};
}

/** Original D21C..D34B: sign fragments shift their local position before
 * adding the whole-unit sign anchor. This differs from car debris placement.
 */
export function placeSignParticle(p:Particle,anchor:Vector,camera:Vector){
 if(p.owner<2||p.style<0||p.style>3)throw Error('Sign debris placement requires original sign styles 0-3');
 return {shape:`exp${p.style}`,position:[p.x,p.y,p.z].map((n,a)=>i16((n>>6)+anchor[a]-camera[a])) as Vector,rotation:[i16(-p.angleX),i16(-p.angleZ),i16(-p.heading)] as Vector};
}

/** Supplied opponent D72D..D829 uses opponent fixed-point position and styles. */
export function placeOpponentParticle(p:Particle,car:Vector,camera:Vector){
 if(p.owner!==1||p.style<8||p.style>11)throw Error('Opponent debris placement requires original opponent styles 8-11');
 return {shape:`exp${p.style-8}`,position:[p.x,p.y,p.z].map((n,a)=>i16(((n+car[a])|0)>>6)-camera[a]).map(i16) as Vector,rotation:[i16(-p.angleX),i16(-p.angleZ),i16(-p.heading)] as Vector};
}
