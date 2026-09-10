import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCarModel} from '../lib/game/car-model.ts';
import {projectOriginalCircle} from '../lib/game/project-original-circle.ts';
import {originalCirclePlan} from '../lib/game/original-circle-plan.ts';

test('upgraded helmet diameter matches the original projected circle size',()=>{
 const group=createCarModel({paintCount:1,vertices:[[0,0,0],[80,0,0]],primitives:[{type:11,flags:0,indices:[0,1],materials:[0]}]},0xffffff,{paint:0,indices:[0],palette:[255,255,255]});
 const helmet=group.children[0] as THREE.Mesh<THREE.SphereGeometry>;
 const diameter=helmet.geometry.parameters.radius*2*400;
 const memory=new Uint8Array(65536);
 for(const distance of [400,800,1600]){
  const projected=projectOriginalCircle([[0,0,distance],[80,0,distance]],[160,100],[0,0],200,[0,320,0,200]);
  const plan=originalCirclePlan(memory,0,160,100,projected.radius!,1,[0,320,0,200]);
  assert.equal(plan.type,'ellipse');
  if(plan.type==='ellipse')assert.equal(diameter*200/distance,(plan.points[2][0]-160)*2);
 }
 assert.deepEqual(helmet.position.toArray(),[0,0,0]);
 helmet.geometry.dispose();(helmet.material as THREE.Material).dispose();
});
