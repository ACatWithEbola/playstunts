import type {Vector} from '../physics/math.ts';

// The native panorama routine deliberately collapses to a single sky/ground
// colour when a cockpit camera approaches a vertical corkscrew attitude. The
// upgraded renderer keeps a drawable panorama by limiting only the 2D source
// artwork's pitch, then applies the complete camera roll during composition.
export const UPGRADED_BACKGROUND_PITCH_LIMIT=72;

const signedAngle=(angle:number)=>((Math.round(angle)+512)&1023)-512;

export function upgradedBackgroundView([roll,pitch,heading]:Vector){
 return {
  angles:[0,Math.max(-UPGRADED_BACKGROUND_PITCH_LIMIT,Math.min(UPGRADED_BACKGROUND_PITCH_LIMIT,signedAngle(pitch))),Math.round(heading)&1023] as Vector,
  rotation:roll===0?0:-roll*Math.PI/512,
 };
}
