import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Exact MS91 MISC.PRE version label; no graphics/rate choices are enabled. */
export function optionsVersionResources(resources:Record<string,ReadonlyArray<number>>,engine?:PhysicsEngineVersion){
 if(resolvePhysicsEngine(engine)!=='ms-1991')return resources;
 return {...resources,gver:Array.from('Version 1.1 (Feb 25 1991)\0',c=>c.charCodeAt(0))};
}
