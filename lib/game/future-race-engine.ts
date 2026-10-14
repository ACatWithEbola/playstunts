import {LEGACY_PHYSICS,MS91_PHYSICS,resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Release switch for new races. Existing recordings retain their own engine.
 * Rollback changes this default only; it must never route saved recordings. */
export const DEFAULT_FUTURE_RACE_ENGINE:PhysicsEngineVersion=MS91_PHYSICS;
export function selectFutureRaceEngine(value:unknown=DEFAULT_FUTURE_RACE_ENGINE):PhysicsEngineVersion{
 const engine=resolvePhysicsEngine(value);
 if(engine!==LEGACY_PHYSICS&&engine!==MS91_PHYSICS)throw Error('Unsupported future-race release target');
 return engine;
}
