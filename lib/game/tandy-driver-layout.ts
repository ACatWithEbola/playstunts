import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Sound-driver generation is chosen at boot, never from a loaded replay. */
export function tandyDriverLayout(generation?:PhysicsEngineVersion){
 if(generation!==undefined&&generation!=='ms-1990'&&generation!=='ms-1991')throw Error('Unsupported Tandy driver generation');
 return generation==='ms-1991'?{bytes:3241,volume:0x5af,velocity:0x5a9,volumeLatch:0x5b5,toneLatch:0x5ba,note:0x577,velocityGain:0x567,sampleDivisor:0x593}:
  {bytes:2993,volume:0x516,velocity:0x510,volumeLatch:0x51c,toneLatch:0x521,note:0x4ff,velocityGain:0x4ef,sampleDivisor:0x50c};
}
