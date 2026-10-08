import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {createShowroomCarModel} from '../lib/game/showroom-car-model.ts';
import type {Assets} from '../lib/game/types.ts';
import materials from '../public/game/track-materials.json' with {type:'json'};
const assets=JSON.parse(readFileSync('public/game/assets.json','utf8')) as Assets;
mkdirSync('public/car-blueprints',{recursive:true});
for(const car of assets.cars){
 const shapes=assets.shapes['ST'+car.id];if(!shapes?.car0)continue;
 const model=createShowroomCarModel(shapes.car0,shapes.car1,{...materials,paint:0});model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 const extent=Math.max(size.x,size.y,size.z),camera=new THREE.OrthographicCamera(-extent,extent,extent*.6,-extent*.6,.01,extent*10);
 camera.position.copy(center).add(new THREE.Vector3(1.8,.3,1).normalize().multiplyScalar(extent*3));camera.lookAt(center);camera.updateMatrixWorld(true);
 const meshes:THREE.Mesh[]=[];model.traverse(n=>{if(n instanceof THREE.Mesh&&!('isLineSegments2' in n))meshes.push(n);});
 const lines:number[][]=[];const ray=new THREE.Raycaster();
 for(const mesh of meshes){
  const edges=new THREE.EdgesGeometry(mesh.geometry,25),points=edges.getAttribute('position');
  for(let i=0;i<points.count;i+=2){
   const a=new THREE.Vector3().fromBufferAttribute(points,i).applyMatrix4(mesh.matrixWorld),b=new THREE.Vector3().fromBufferAttribute(points,i+1).applyMatrix4(mesh.matrixWorld);
   const mid=a.clone().add(b).multiplyScalar(.5),direction=mid.clone().sub(camera.position).normalize();ray.set(camera.position,direction);
   const hit=ray.intersectObjects(meshes,false)[0];if(hit&&hit.distance<camera.position.distanceTo(mid)-extent*.004)continue;
   // Undo the orthographic viewport normalization before fitting the drawing.
   // A single world-space scale preserves circular wheels and body proportions.
   a.project(camera);b.project(camera);lines.push([a.x*extent,a.y*extent*.6,b.x*extent,b.y*extent*.6]);
  }edges.dispose();
 }
 const xs=lines.flatMap(l=>[l[0],l[2]]),ys=lines.flatMap(l=>[l[1],l[3]]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(220/(maxX-minX),114/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const project=(x:number,y:number)=>`${(120+(x-cx)*scale).toFixed(2)},${(65-(y-cy)*scale).toFixed(2)}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 130"><g fill="none" stroke="#9dc6db" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round">${lines.map(l=>`<path d="M${project(l[0],l[1])}L${project(l[2],l[3])}"/>`).join('')}</g></svg>`;
 writeFileSync(`public/car-blueprints/${car.id}.svg`,svg);console.log(car.id,lines.length,'visible edges');
}
