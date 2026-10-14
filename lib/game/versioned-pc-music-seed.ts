import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import type {OriginalPcSpeakerMusicSeed} from './pc-speaker-music-runtime.ts';
import {versionedPc15Resource} from './versioned-pc15-resource.ts';
import {initializeOriginalPcSpeaker} from './pc-speaker-control.ts';

/** The bundled seeds precede the first sequence tick. Install the selected
 * driver and its inactive voice slots without changing the captured score. */
export function versionedPcMusicSeed(seed:OriginalPcSpeakerMusicSeed,engine?:PhysicsEngineVersion):OriginalPcSpeakerMusicSeed{
 if(engine!=='ms-1991')return seed;
 if(seed.physicsEngine==='ms-1991')return seed;
 if(seed.hardware.length!==5||seed.hardware.some(v=>v.length!==46||v[0]!==255||v[1]!==0))throw Error('PC music conversion requires an inactive five-slot seed');
 const driver=versionedPc15Resource('PC15.DRV',engine)!.slice(0,0x2e9);
 const initialized=initializeOriginalPcSpeaker(driver,seed.port61,engine);
 const hardware=seed.hardware.map(v=>v.slice());
 // Driver initialization reports seven slots; regular audio reset marks each
 // unowned record with owner FF and no retained instrument pointer.
 while(hardware.length<initialized.channels){const voice=Array<number>(46).fill(0);voice[0]=voice[44]=255;hardware.push(voice);}
 return {...seed,physicsEngine:engine,driver:Array.from(driver),hardware,
  initialWrites:[...seed.initialWrites.map(w=>w.slice()),...initialized.writes]};
}
