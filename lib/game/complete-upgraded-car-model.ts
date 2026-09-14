import {createCarModel,createOriginalCarUnderbodyModel,type OriginalPaint} from './car-model.ts';
import {applyUpgradedCarMaterials} from './upgraded-car-materials.ts';
import type {Shape} from './types.ts';

function lateralSpan(shape:Shape){
 return Math.max(...shape.vertices.map(vertex=>vertex[0]))-Math.min(...shape.vertices.map(vertex=>vertex[0]));
}

/** Compose the highest-detail authored exterior with the racing model's exact
 * rollover floor. The returned sourceScale maps live car1 coordinates into the
 * car0 local frame; all eleven original banks use a factor of exactly twenty. */
export function createCompleteUpgradedCarModel(shape:Shape,raceShape:Shape|undefined,color:number,paint:OriginalPaint){
 const raceSpan=raceShape?lateralSpan(raceShape):0;
 const sourceScale=raceShape&&raceSpan?lateralSpan(shape)/raceSpan:1;
 const model=createCarModel(shape,color,paint);
 applyUpgradedCarMaterials(model,shape);
 if(raceShape&&shape!==raceShape){
  const underbody=createOriginalCarUnderbodyModel(raceShape,color,paint);
  if(underbody){
   applyUpgradedCarMaterials(underbody.model,underbody.shape);
   underbody.model.scale.setScalar(sourceScale);
   underbody.model.userData.originalRacingUnderbody=true;
   model.add(underbody.model);
  }
 }
 return {model,sourceScale};
}
