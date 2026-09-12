import type {Shape} from './types.ts';

const DIVIDED_ROADS_WITH_TREES=new Set(['GAME1.wroa','GAME1.zwro']);
const DIVIDED_ROAD_CONNECTORS=new Set(['GAME1.gwro','GAME1.zgwr']);
const DIVIDED_ROAD_TREE_MATERIALS=new Set([10,98,99]);
const ACTUALLY_PERFORATED_SHADOWS=new Set([
 'GAME2.brid','GAME2.zbri',
 'GAME2.elrd','GAME2.zelr','GAME2.elsp','GAME2.zesp',
 'GAME2.wind','GAME2.zwin',
]);

/** Source stipple is usually surface shading, not a physical hole. Only the
 * drawbridge/elevated bridge decks and windmill blade masks describe real
 * openings that sunlight should pass through. */
export function upgradedSceneryUsesPatternedShadow(shapeName:string){
 return ACTUALLY_PERFORATED_SHADOWS.has(shapeName);
}

// Banked road pieces change height across the driving surface, but they are
// still ground receivers rather than free-standing scenery. Registering their
// complete meshes as casters makes the raised edge project a dark strip across
// the neighbouring tile at the join. Keep those continuous road surfaces out
// of the shared scenery pass; barriers, ramps, bridges and landmarks remain.
const RECEIVER_ONLY_ROADS=new Set([
 'GAME1.rban','GAME1.zrba','GAME1.lban','GAME1.zlba',
 'GAME1.bank','GAME1.zban','GAME1.btur','GAME1.zbtu',
 // The sloped DEFAULT-road model lies directly on its hill terrain. Treating
 // the complete tile as elevated scenery projects its narrow deck fragments
 // diagonally back onto that same hill in the distant shadow cascade.
 'GAME2.rdup','GAME2.zrdu','GAME2.goup',
]);

/** Flat road/terrain meshes remain receivers. Raised track structures and
 * landmarks share the upgraded directional caster pass. */
export function upgradedSceneryCastsShadow(shape:Shape,shapeName?:string){
 if(shapeName&&RECEIVER_ONLY_ROADS.has(shapeName))return false;
 const indices=new Set(shape.primitives.filter(primitive=>primitive.type>=3&&primitive.type<=12).flatMap(primitive=>primitive.indices));
 if(!indices.size)return false;
 const heights=Array.from(indices,index=>shape.vertices[index][1]);
 // Source geometry already distinguishes a painted flat surface from a raised
 // object. Do not impose a guessed minimum height: the 25-unit road barriers
 // are real volumes and must cast just as buildings and ramps do.
 return Math.max(...heights)-Math.min(...heights)>1e-6;
}

/** Divided-road tiles combine ordinary asphalt and a median with a tree or
 * connector marker. Only that tree/marker casts; the user explicitly rejected
 * the median's long edge shadow. A raised marker must not accidentally promote
 * every asphalt polygon in the complete connector model into a caster. */
export function upgradedCompositeShadowShapes(shape:Shape,shapeName:string){
 const connector=DIVIDED_ROAD_CONNECTORS.has(shapeName);
 const heightRange=(primitive:Shape['primitives'][number])=>{
  const heights=primitive.indices.map(index=>shape.vertices[index][1]);
  return {min:Math.min(...heights),max:Math.max(...heights)};
 };
 if(!DIVIDED_ROADS_WITH_TREES.has(shapeName)&&!connector){
  if(!upgradedSceneryCastsShadow(shape,shapeName))return undefined;
  const groundRoad=(primitive:Shape['primitives'][number],paint=false)=>{
   if(primitive.type<3||primitive.type>10||!primitive.materials.every(material=>material===19||(paint&&(material===18||material===21))))return false;
   const {min,max}=heightRange(primitive);
   // Ground-contact aprons are Y0. The original low-detail pipe floor is
   // raised to Y3 to avoid its own integer-renderer overlap. Elevated decks
   // (Y450), ramps and curved tube walls must continue to cast normally.
   return Math.abs(max-min)<1e-6&&min>=0&&max<=3;
  };
  if(!shape.primitives.some(primitive=>groundRoad(primitive)))return undefined;
  const receiverPrimitives=shape.primitives.filter(primitive=>groundRoad(primitive,true));
  const receiverSet=new Set(receiverPrimitives);
  return {caster:{...shape,primitives:shape.primitives.filter(primitive=>!receiverSet.has(primitive))},receiver:{...shape,primitives:receiverPrimitives}};
 }
 const receiverPrimitives=shape.primitives.filter(primitive=>{
  if(primitive.type<3||primitive.type>10)return false;
  const {min,max}=heightRange(primitive);return Math.abs(max-min)<1e-6;
 });
 const casterPrimitives=shape.primitives.filter(primitive=>{
  if(primitive.type<3||primitive.type>10)return false;
  if(connector){
   // Source marker faces sit on the24-unit median and extend above it;
   // median sides start at0, and its cap stays at24. Their shared beige
   // material IDs cannot safely distinguish the marker from the median.
   const {min,max}=heightRange(primitive);return min>=24&&max>24;
  }
  return primitive.materials.some(material=>DIVIDED_ROAD_TREE_MATERIALS.has(material));
 });
 return {
  caster:{...shape,primitives:casterPrimitives},
  receiver:{...shape,primitives:receiverPrimitives},
 };
}
