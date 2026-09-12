import * as THREE from 'three';

/**
 * Ground a showroom car on its four road tyres. Some cars also carry a spare
 * wheel, so only the laterally outer tyres participate in the contact plane.
 * The source meshes and all authored transforms remain unchanged; only the
 * containing car group is translated vertically.
 */
export function groundShowroomCarOnRoadTires(model:THREE.Group){
 model.updateMatrixWorld(true);
 const tires:THREE.Mesh[]=[];
 model.traverse(node=>{if(node instanceof THREE.Mesh&&node.userData.originalWheelPart==='tire')tires.push(node);});
 if(!tires.length){
  const bodyBottom=new THREE.Box3().setFromObject(model).min.y;
  model.position.y-=bodyBottom;model.updateMatrixWorld(true);
  return bodyBottom;
 }
 const maxLateral=Math.max(...tires.map(tire=>Math.abs(tire.position.x)));
 const roadTires=tires.filter(tire=>Math.abs(tire.position.x)>=maxLateral*.75);
 const contactY=Math.min(...roadTires.map(tire=>new THREE.Box3().setFromObject(tire).min.y));
 model.position.y-=contactY;model.updateMatrixWorld(true);
 return contactY;
}
