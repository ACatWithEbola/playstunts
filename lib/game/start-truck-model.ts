import * as THREE from 'three';
import {createTrackModel,type TrackMaterials} from './track-model.ts';
import {originalStartTruckVisual} from './start-truck-visual.ts';
import type {Shape} from './types.ts';
/** One live transporter mesh; replacing a door pose releases its GPU resources. */
export function createStartTruckModel(baseline:Uint8Array,shape:Shape,materials:TrackMaterials){
 const scratch=baseline.slice(),group=new THREE.Group();let model:THREE.Group|undefined,cutawayModel:THREE.Group|undefined,lastAngle:number|undefined;
 const dispose=(entry:THREE.Group|undefined)=>{if(!entry)return;group.remove(entry);entry.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});};
 return {group,setCutaway(enabled:boolean){if(model)model.visible=!enabled;if(cutawayModel)cutawayModel.visible=enabled;},update(live:Uint8Array){
  const wasVisible=group.visible;
  const visual=originalStartTruckVisual(scratch,live,0x2d1a0,shape);
  group.visible=visual!==null;if(!visual)return {changed:wasVisible,rebuilt:false};
  const angle=new DataView(live.buffer,live.byteOffset,live.byteLength).getUint16(0x2d1a0+0x93dc,true);
  const rebuilt=!model||angle!==lastAngle;
  const heading=visual.heading*Math.PI/512;
  const changed=!wasVisible||rebuilt||group.position.x!==visual.position[0]||group.position.y!==visual.position[1]||group.position.z!==visual.position[2]||group.rotation.y!==heading;
  if(rebuilt){
   dispose(model);dispose(cutawayModel);
   model=createTrackModel(visual.shape,materials,visual.paint);group.add(model);lastAngle=angle;
   // The chase cutaway preserves sidewalls, floor, roof, underside and wheels.
   // Only the two moving rear doors and vertical cross-panels perpendicular to
   // the car's path are omitted, because those are the faces a rear chase eye
   // can look through. The complete animated model still serves the original
   // cameras, Far chase and the shadow pass.
   const cutawayPrimitives=visual.shape.primitives.filter((primitive,index)=>{
    if(primitive.type===12)return true;
    if(index===7||index===8)return false;
    const points=primitive.indices.map(vertex=>visual.shape.vertices[vertex]);
    const heights=points.map(point=>point[1]),depths=points.map(point=>point[2]);
    const verticalCrossPanel=Math.max(...heights)>Math.min(...heights)&&Math.max(...depths)-Math.min(...depths)<=2;
    return !verticalCrossPanel;
   });
   const cutawayShape={...visual.shape,primitives:cutawayPrimitives};
   cutawayModel=createTrackModel(cutawayShape,materials,visual.paint);cutawayModel.visible=false;group.add(cutawayModel);
  }
  group.position.set(visual.position[0],visual.position[1],visual.position[2]);group.rotation.y=heading;
  return {changed,rebuilt};
 }};
}
