import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
/** Presentation/results follow the actual loaded session, never a page default.
 * Return a copy; shared source tables and stored recordings stay untouched. */
export function activeRaceData<T extends object>(data:T,session:{physicsEngine:PhysicsEngineVersion;framesPerSecond:ReplayCadence}){
 return {...data,physicsEngine:resolvePhysicsEngine(session.physicsEngine),framesPerSecond:resolveReplayCadence(session.framesPerSecond)};
}
