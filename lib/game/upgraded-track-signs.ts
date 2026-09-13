import * as THREE from 'three';
import {createTrackModelFactory,type TrackMaterials} from './track-model.ts';
import {selectOriginalTrackSign} from './select-track-sign.ts';
import {originalTrackSignSubmission} from './track-sign-submission.ts';
import {readUpgradedShape} from './upgraded-submission.ts';
/** Signs are generated beside roads and do not occupy raw track tiles.
 * Read their native anchors, including slope elevation, without changing memory. */
export function createUpgradedTrackSigns(memory:Uint8Array,materials:TrackMaterials){
 const d=0x2d1a0,group=new THREE.Group(),factory=createTrackModelFactory(materials);
 const signs:{index:number;column:number;row:number;model:THREE.Group}[]=[];
 const seen=new Set<number>();
 for(let row=0;row<30;row++)for(let column=0;column<30;column++){
  const selected=selectOriginalTrackSign(memory,d,column,row);
  if(selected.index===255||seen.has(selected.index))continue;
  seen.add(selected.index);
  const record=Uint8Array.from(originalTrackSignSubmission(memory,d,selected.index,[0,0,0]).record),v=new DataView(record.buffer);
  const descriptor=v.getUint16(6,true),model=factory(readUpgradedShape(memory,descriptor),record[19]);
  model.position.set(v.getInt16(0,true),v.getInt16(2,true),v.getInt16(4,true));
  model.rotation.y=v.getInt16(14,true)*Math.PI/512;
  model.visible=selected.mode==='intact';
  model.userData.originalTrackSign={index:selected.index,column,row,descriptor};
  signs.push({index:selected.index,column,row,model});group.add(model);
 }
 return {group,update(live:Uint8Array){
  let changed=false;
  for(const sign of signs){
   const selected=selectOriginalTrackSign(live,d,sign.column,sign.row);
   const visible=selected.index===sign.index&&selected.mode==='intact';changed ||= visible!==sign.model.visible;sign.model.visible=visible;
  }
  return changed;
 }};
}
