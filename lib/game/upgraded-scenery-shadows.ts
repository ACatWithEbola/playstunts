import type {Shape} from './types.ts';

// Banked road pieces change height across the driving surface, but they are
// still ground receivers rather than free-standing scenery. Registering their
// complete meshes as casters makes the raised edge project a dark strip across
// the neighbouring tile at the join. Keep those continuous road surfaces out
// of the shared scenery pass; barriers, ramps, bridges and landmarks remain.
const RECEIVER_ONLY_BANKED_ROADS=new Set([
 'GAME1.rban','GAME1.zrba','GAME1.lban','GAME1.zlba',
 'GAME1.bank','GAME1.zban','GAME1.btur','GAME1.zbtu',
]);

/** Flat road/terrain meshes remain receivers. Raised track structures and
 * landmarks share the upgraded directional caster pass. */
export function upgradedSceneryCastsShadow(shape:Shape,shapeName?:string){
 if(shapeName&&RECEIVER_ONLY_BANKED_ROADS.has(shapeName))return false;
 const indices=new Set(shape.primitives.filter(primitive=>primitive.type>=3&&primitive.type<=12).flatMap(primitive=>primitive.indices));
 if(!indices.size)return false;
 const heights=Array.from(indices,index=>shape.vertices[index][1]);
 // Source geometry already distinguishes a painted flat surface from a raised
 // object. Do not impose a guessed minimum height: the 25-unit road barriers
 // are real volumes and must cast just as buildings and ramps do.
 return Math.max(...heights)-Math.min(...heights)>1e-6;
}
