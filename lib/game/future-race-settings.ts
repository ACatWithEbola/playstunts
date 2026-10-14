import {selectFutureRaceEngine} from './future-race-engine.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import type {Ms91GraphicsSettings} from './ms91-graphics-options.ts';
interface FutureRaceMetadata {physicsEngine?:PhysicsEngineVersion;framesPerSecond?:10|20;experimental10Hz?:boolean;experimentalMs91SlowVideoManagement?:boolean}
/** Menu private-score identity must follow the configured next-race cadence. */
export function configuredFutureRaceCadence(engine:PhysicsEngineVersion,settings?:Ms91GraphicsSettings):10|20{
 return futureRaceSettings({framesPerSecond:20 as const},engine,settings).framesPerSecond??20;
}
/** Fresh-race settings only. Replay loading must use its recorded engine/rate.
 * Settings follow MS91 capability; the separate release default remains gated. */
export function futureRaceSettings<T extends FutureRaceMetadata>(data:T,engine:PhysicsEngineVersion,settings?:Ms91GraphicsSettings):Omit<T,keyof FutureRaceMetadata>&FutureRaceMetadata&{physicsEngine:PhysicsEngineVersion}{
 const physicsEngine=selectFutureRaceEngine(engine);
 if(physicsEngine!=='ms-1991'){
  resolveReplayCadence(data.framesPerSecond);
  // These are fresh-race defaults, never a replay conversion. Discard modern
  // playback capabilities if the caller supplies data from a slow replay.
  const {physicsEngine:recordedEngine,framesPerSecond,experimental10Hz,experimentalMs91SlowVideoManagement,...legacy}=data;
  return {...legacy,physicsEngine,...(framesPerSecond!==undefined?{framesPerSecond:20 as const}:{})};
 }
 if(!settings)return {...data,physicsEngine};
 if(!Number.isInteger(settings.graphics)||settings.graphics<0||settings.graphics>4)throw Error('Invalid MS91 graphics level');
 if(typeof settings.slowVideoManagement!=='boolean')throw Error('Invalid MS91 video-management setting');
 if(settings.configuredFramesPerSecond!==10&&settings.configuredFramesPerSecond!==20)throw Error('Invalid MS91 simulation rate');
 return {...data,physicsEngine,framesPerSecond:settings.configuredFramesPerSecond,experimental10Hz:settings.configuredFramesPerSecond===10,experimentalMs91SlowVideoManagement:settings.slowVideoManagement};
}
/** Replay loading capability and video preferences only. Recorded engine and
 * cadence are resolved later from the selected file, not from these settings. */
export function replayVideoSettings<T extends FutureRaceMetadata>(data:T,settings?:Ms91GraphicsSettings):Omit<T,keyof FutureRaceMetadata>&FutureRaceMetadata{
 // Private replay capability follows recorded identity, not the selected
 // future engine or preview settings. The loader still validates MS91/10Hz.
 if(!settings)return {...data,experimental10Hz:true};
 const checked=futureRaceSettings(data,'ms-1991',settings);
 return {...data,experimental10Hz:true,experimentalMs91SlowVideoManagement:checked.experimentalMs91SlowVideoManagement};
}
