/** Explicit per-race identity. Missing metadata always means legacy, never latest.
 * BB11 remains experimental until the full compatibility release gate passes. */
export type PhysicsEngineVersion = 'ms-1990' | 'bb-1991' | 'ms-1991';
export const LEGACY_PHYSICS: PhysicsEngineVersion = 'ms-1990';
export const BB11_PHYSICS: PhysicsEngineVersion = 'bb-1991';
export const MS91_PHYSICS: PhysicsEngineVersion = 'ms-1991';
export function resolvePhysicsEngine(value: unknown): PhysicsEngineVersion {
 if(value===undefined||value===null||value===LEGACY_PHYSICS)return LEGACY_PHYSICS;
 if(value===BB11_PHYSICS)return BB11_PHYSICS;
 if(value===MS91_PHYSICS)return MS91_PHYSICS;
 throw Error('Unsupported physics engine version');
}
/** Legacy IDIV truncates toward zero; BB11 SAR rounds signed negatives down.
 * Values are signed 16-bit before scaling, as in the original routines. */
export function scaleSteeringWord(value:number,shift:number,version:PhysicsEngineVersion=LEGACY_PHYSICS):number {
 if(!Number.isInteger(shift)||shift<0||shift>15)throw Error('Invalid steering scale');
 const signed=(value<<16)>>16;
 return version!==LEGACY_PHYSICS?signed>>shift:Math.trunc(signed/(2**shift));
}
/** Shared provisional 1991 arithmetic; MS91 still needs original-game verification. */
export function uses1991Physics(version?:PhysicsEngineVersion){return resolvePhysicsEngine(version)!==LEGACY_PHYSICS;}
