import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {createCompleteUpgradedCarModel} from '../lib/game/complete-upgraded-car-model.ts';
import {createShowroomCarModel} from '../lib/game/showroom-car-model.ts';
import {readOriginalMaterialPatterns} from '../lib/game/original-material-pattern.ts';
import {originalPrimitiveMaterial} from '../lib/game/primitive-record-header.ts';
import type {Assets} from '../lib/game/types.ts';

const assets:Assets=JSON.parse(readFileSync(new URL('../public/game/assets.json',import.meta.url),'utf8'));
const palette=JSON.parse(readFileSync(new URL('../public/game/track-materials.json',import.meta.url),'utf8'));
const nativePatterns=readOriginalMaterialPatterns(new Uint8Array(readFileSync(new URL('../public/game/native-resource-base.bin',import.meta.url))));
const showroomPatterns=JSON.parse(readFileSync(new URL('../lib/game/showroom-material-patterns.json',import.meta.url),'utf8'));

await test('showroom pattern tables are exactly the native selection and driving tables',()=>{
 assert.deepEqual(showroomPatterns,nativePatterns);
});

function meshes(model:THREE.Group){
 const result:THREE.Mesh[]=[];
 model.traverse(node=>{if(node instanceof THREE.Mesh)result.push(node);});
 return result;
}

for(const car of assets.cars)await test(`${car.name}: showroom preserves detailed driving geometry, paint and proportional trim`,()=>{
 const {car0,car1}=assets.shapes['ST'+car.id],before=JSON.stringify([car0,car1]);
 for(let paint=0;paint<5;paint++){
  const sourcePaint={paint,...palette,paletteMaterial:0};
  const {model:driving,sourceScale}=createCompleteUpgradedCarModel(car0,car1,0xffffff,{...sourcePaint,...nativePatterns});
  const showroom=createShowroomCarModel(car0,car1,sourcePaint);
  const raceMeshes=meshes(driving),showroomMeshes=meshes(showroom);
  assert.equal(showroomMeshes.length,raceMeshes.length);
  showroomMeshes.forEach((node,i)=>{
   const raceNode=raceMeshes[i];
   assert.deepEqual(node.position.toArray(),raceNode.position.toArray());
   assert.deepEqual(node.scale.toArray(),raceNode.scale.toArray());
   assert.deepEqual(node.geometry.index?.array,raceNode.geometry.index?.array);
   assert.deepEqual(Object.keys(node.geometry.attributes),Object.keys(raceNode.geometry.attributes));
   for(const [name,attribute] of Object.entries(node.geometry.attributes)){
    const source=raceNode.geometry.attributes[name];
    assert.deepEqual(attribute instanceof THREE.InterleavedBufferAttribute?attribute.data.array:attribute.array,source instanceof THREE.InterleavedBufferAttribute?source.data.array:source.array);
   }
   const material=node.material as THREE.MeshBasicMaterial,raceMaterial=raceNode.material as THREE.MeshBasicMaterial;
   assert.equal(material.color.getHex(),raceMaterial.color.getHex());
   assert.equal(material.side,raceMaterial.side);
   assert.equal(node.userData.originalCarLamp,raceNode.userData.originalCarLamp);
   // Check each detailed polygon against the source, not only against a
   // second model produced by the same material implementation.
   if(node.parent===showroom&&node.userData.originalBodyFace){
    const primitive=car0.primitives[node.userData.originalPrimitive],source=originalPrimitiveMaterial(primitive.materials[paint],0);
    const pattern=node.geometry.getAttribute('originalPattern');
    assert.ok(pattern,'every authored polygon carries its original material mask');
    for(let vertex=0;vertex<pattern.count;vertex++){
     assert.equal(pattern.getX(vertex),nativePatterns.patterns[source]);
     assert.equal(pattern.getY(vertex),nativePatterns.masks[source]);
    }
   }
   assert.equal(node.visible,!node.userData.originalGroundContactPanel);
   assert.equal(raceNode.visible,true,'showroom must not change driving visibility');
   if(material instanceof LineMaterial&&raceMaterial instanceof LineMaterial){
    // LineMaterial's width is already in world units; unlike geometry, the
    // driving model's 400/sourceScale transform does not multiply it.
    const drivingWidth= new THREE.Box3().setFromObject(driving).getSize(new THREE.Vector3()).x*400/sourceScale;
    const showroomWidth=new THREE.Box3().setFromObject(showroom).getSize(new THREE.Vector3()).x;
    assert.ok(Math.abs(material.linewidth/showroomWidth-raceMaterial.linewidth/drivingWidth)<1e-10);
    assert.equal(raceMaterial.linewidth,.421875,'showroom must not change driving trim');
   }
  });
  const tires=showroomMeshes.filter(node=>node.userData.originalWheelPart==='tire');
  const outer=Math.max(...tires.map(tire=>Math.abs(tire.position.x)));
  const bottoms=tires.filter(tire=>Math.abs(tire.position.x)>=outer*.75).map(tire=>new THREE.Box3().setFromObject(tire).min.y);
  assert.ok(Math.abs(Math.min(...bottoms))<1e-6,'road tires rest on the showroom floor');
  for(const node of [...raceMeshes,...showroomMeshes]){
   node.geometry.dispose();
   for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();
  }
 }
 assert.equal(JSON.stringify([car0,car1]),before,'authored assets remain unchanged');
});

await test('Lancia grille stipple, divider and lower rectangle remain distinct authored details',()=>{
 const {car0,car1}=assets.shapes.STLANC;
 const showroom=createShowroomCarModel(car0,car1,{paint:0,...palette,paletteMaterial:0});
 const face=(index:number)=>showroom.children.find(node=>node.userData.originalPrimitive===index) as THREE.Mesh;
 const backing=face(40),grille=face(41),divider=face(42),lower=face(26);
 assert.deepEqual(car0.primitives[41].indices,car0.primitives[40].indices);
 assert.equal(grille.geometry.getAttribute('originalPattern').getX(0),1);
 assert.equal(grille.geometry.getAttribute('originalPattern').getY(0),0xcc33);
 assert.equal(backing.geometry.getAttribute('originalPattern').getX(0),0);
 assert.equal(divider.geometry.getAttribute('originalPattern').getX(0),0);
 assert.equal(lower.geometry.getAttribute('originalPattern').getX(0),0);
 assert.equal((grille.material as THREE.MeshStandardMaterial).color.getHex(),0x484848);
 assert.equal((backing.material as THREE.MeshStandardMaterial).color.getHex(),0x545454);
 assert.equal((lower.material as THREE.MeshBasicMaterial).color.getHex(),0xa8a8a8);
 assert.ok(car0.primitives[26].indices.every(index=>car0.vertices[index][1]<=200));
 assert.ok(car0.primitives[41].indices.every(index=>car0.vertices[index][1]>=200));
 for(const node of meshes(showroom)){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}
});
