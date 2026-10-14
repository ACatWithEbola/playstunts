import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Legacy61E2 adjusts signed negative values before halving; MS9161E0 SARs. */
export function evaluationPortraitY(height:number,physicsEngine?:PhysicsEngineVersion,packed=false){
 const delta=physicsEngine==='ms-1991'||packed?(99-height)<<16>>16:99-height;
 return physicsEngine==='ms-1991'?delta>>1:Math.trunc(delta/2)||0;
}
