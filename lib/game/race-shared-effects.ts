import {stepRaceCameras} from '../physics/race-cameras.ts';
import {advanceParticles,type Particles} from './particles.ts';
/** Original race caller 0x9714..0x9724: cameras first, active particle update next. Audio follows separately. */
export function stepRaceSharedEffects(cameraArgs:Parameters<typeof stepRaceCameras>,particles:Particles,playerHeight:number){
 const cameras=stepRaceCameras(...cameraArgs);
 return {cameras,particles:(particles.active&255)?advanceParticles(particles,playerHeight):particles};
}
