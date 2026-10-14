import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Experimental manual-race policy follows the loaded session, never the
 * page's future-race default. Undefined retains current rendering behavior. */
export function nativeRendererPolicy(engine:PhysicsEngineVersion,slowVideoManagement?:boolean){
 const version=resolvePhysicsEngine(engine);
 if(version!=='ms-1991'||slowVideoManagement===undefined)return {};
 if(typeof slowVideoManagement!=='boolean')throw Error('Invalid MS91 video-management policy');
 return {experimentalMs91RegionFlags:true,experimentalMs91SlowVideoManagement:slowVideoManagement,experimentalMs91PartialBackground:slowVideoManagement,experimentalMs91SelectiveCopy:slowVideoManagement};
}
/** Alternate drivers require an explicit allocated-window policy as well. */
export function nativeDisplayRendererPolicy(engine:PhysicsEngineVersion,slowVideoManagement?:boolean){
 const policy=nativeRendererPolicy(engine,slowVideoManagement);
 return Object.keys(policy).length?{...policy,experimentalMs91WindowCopy:slowVideoManagement===true}:policy;
}
