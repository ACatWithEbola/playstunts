import * as THREE from 'three';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import type {OriginalPaint} from './car-model.ts';
import {createCompleteUpgradedCarModel} from './complete-upgraded-car-model.ts';
import {groundShowroomCarOnRoadTires} from './showroom-car-presentation.ts';
import {setUpgradedCarGroundContactPanels} from './upgraded-car-materials.ts';
import type {Shape} from './types.ts';
import showroomMaterialPatterns from './showroom-material-patterns.json' with {type:'json'};

/** Use the enhanced game's detailed exterior and lower shell, in showroom
 * units. GPU depth/facing keeps the complete model available while orbiting,
 * just as it does in the enhanced selection and driving renderers. */
export function createShowroomCarModel(shape:Shape,raceShape:Shape|undefined,paint:OriginalPaint){
 // Match selection/driving masks as well as their palette colours. These
 // retained MCGA tables (DS:4FC6, 50C8, 4EC4) are checked against the native
 // resource image. Lancia's material-119 grille is a stipple over grey backing;
 // without its mask the attached face hides that detail with an opaque slab.
 const {model,sourceScale}=createCompleteUpgradedCarModel(shape,raceShape,0xffffff,{...showroomMaterialPatterns,...paint});
 // The driving renderer scales this geometry by 400/sourceScale. LineMaterial
 // expands world-unit widths AFTER model transforms, so its rods and trim do
 // not inherit that scale. Convert their calibrated driving-world widths too:
 // otherwise the NSX grille and other trim are twenty times too thick here.
 model.traverse(node=>{
  if(!(node instanceof THREE.Mesh))return;
  for(const material of Array.isArray(node.material)?node.material:[node.material]){
   if(material instanceof LineMaterial&&material.worldUnits)material.linewidth*=sourceScale/400;
  }
  node.castShadow=false;node.receiveShadow=false;
 });
 groundShowroomCarOnRoadTires(model);
 // This view always rests on a floor. Match the driving renderer's treatment
 // of the Countach's coplanar lower-chassis fills at the tire contact plane.
 setUpgradedCarGroundContactPanels(model,true);
 return model;
}
