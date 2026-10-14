import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** A completed race owns dialog behavior. Never inherit a future-race default
 * when showing legacy results; missing metadata deliberately stays legacy. */
export function bindResultDialogEngine<T extends object>(host:T,physicsEngine?:PhysicsEngineVersion){
 return {...host,physicsEngine};
}
