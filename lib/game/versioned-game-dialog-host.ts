import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {ms91DialogResources} from './ms91-dialog-resources.ts';
/** GAME/MAIN/MISC dialogs follow their owning race, not the future-race default.
 * TEDIT has overlapping IDs and must use its separate editor overlay instead. */
export function versionedGameDialogHost<T extends {resources:Record<string,ReadonlyArray<number>>}>(host:T,engine?:PhysicsEngineVersion){
 return {...host,physicsEngine:engine,resources:ms91DialogResources(host.resources,engine)};
}
