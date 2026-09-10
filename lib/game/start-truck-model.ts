import * as THREE from 'three';
import {createTrackModel,type TrackMaterials} from './track-model.ts';
import {originalStartTruckVisual} from './start-truck-visual.ts';
import type {Shape} from './types.ts';
/** One live transporter mesh; replacing a door pose releases its GPU resources. */
export function createStartTruckModel(baseline:Uint8Array,shape:Shape,materials:TrackMaterials){
 const scratch=baseline.slice(),group=new THREE.Group();let model:THREE.Group|undefined,lastAngle:number|undefined;
 return {group,update(live:Uint8Array){
  const visual=originalStartTruckVisual(scratch,live,0x2d1a0,shape);
  group.visible=visual!==null;if(!visual)return;
  const angle=new DataView(live.buffer,live.byteOffset,live.byteLength).getUint16(0x2d1a0+0x93dc,true);
  if(!model||angle!==lastAngle){
   if(model){group.remove(model);model.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});}
   model=createTrackModel(visual.shape,materials,visual.paint);group.add(model);lastAngle=angle;
  }
  group.position.set(visual.position[0],visual.position[1],visual.position[2]);group.rotation.y=visual.heading*Math.PI/512;
 }};
}
