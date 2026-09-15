import * as THREE from 'three';
import type {Shape} from './types.ts';

type Edge={from:number;to:number};

/** Recover the outside of the white source polygons without copying the
 * internal joins between the cloud's original flat facets. */
export function enhancedCloudOutline(shape:Shape){
 const edges=new Map<string,{count:number;edge:Edge}>();
 for(const primitive of shape.primitives){
  if(primitive.materials[0]!==96||primitive.indices.length<3)continue;
  for(let index=0;index<primitive.indices.length;index++){
   const from=primitive.indices[index]!,to=primitive.indices[(index+1)%primitive.indices.length]!;
   const key=from<to?`${from}/${to}`:`${to}/${from}`,found=edges.get(key);
   if(found)found.count++;else edges.set(key,{count:1,edge:{from,to}});
  }
 }
 const boundary=[...edges.values()].filter(entry=>entry.count===1).map(entry=>entry.edge);
 if(boundary.length<3)return [];
 const adjacency=new Map<number,number[]>();
 for(const {from,to} of boundary){
  adjacency.set(from,[...(adjacency.get(from)??[]),to]);
  adjacency.set(to,[...(adjacency.get(to)??[]),from]);
 }
 const loops:number[][]=[];const unused=new Set(boundary.map(({from,to})=>from<to?`${from}/${to}`:`${to}/${from}`));
 while(unused.size){
  const first=[...unused][0]!.split('/').map(Number),loop=[first[0]!];let previous=-1,current=first[0]!;
  while(true){
   const next=(adjacency.get(current)??[]).find(candidate=>candidate!==previous&&unused.has(current<candidate?`${current}/${candidate}`:`${candidate}/${current}`));
   if(next===undefined)break;
   unused.delete(current<next?`${current}/${next}`:`${next}/${current}`);previous=current;current=next;
   if(current===loop[0])break;loop.push(current);
  }
  if(loop.length>=3)loops.push(loop);
 }
 const outline=loops.sort((left,right)=>right.length-left.length)[0]??[];
 return outline.map(index=>new THREE.Vector2(shape.vertices[index]![0],shape.vertices[index]![1]));
}

type CloudLobe=readonly[x:number,y:number,z:number,width:number,height:number,depth:number];
export type EnhancedCloudType='A'|'B'|'C';

/** Broad masses follow the three supplied references: A has a low
 * three-crown ridge, B a tall central crown, C a full asymmetric double crown.
 * Front billows sit below those crowns and give the cloud real depth. */
const CLOUD_LOBES:Record<EnhancedCloudType,CloudLobe[]>={
 A:[
  [0,.36,-.11,1.05,.27,.43],
  [-.72,.59,-.03,.38,.42,.43],[-.06,.57,-.10,.34,.36,.46],[.58,.60,-.09,.39,.40,.44],
  [-.94,.32,.12,.29,.25,.32],[.90,.35,.09,.34,.28,.34],
  [-.67,.24,.31,.34,.27,.34],[-.22,.27,.31,.35,.25,.37],[.25,.19,.36,.39,.28,.35],[.63,.22,.26,.34,.24,.34],
  [-.42,.43,.34,.24,.24,.28],[.44,.42,.29,.27,.23,.3],
 ],
 B:[
  [0,.34,-.06,.77,.26,.45],
  [.02,.77,-.14,.39,.47,.4],[-.33,.58,-.05,.35,.33,.38],[.40,.55,-.05,.36,.35,.39],
  [-.68,.28,.02,.31,.25,.33],[.7,.28,.01,.3,.25,.34],
  [-.39,.3,.3,.34,.28,.35],[.05,.27,.34,.38,.3,.37],[.47,.23,.3,.33,.25,.34],
  [-.17,.54,.26,.29,.29,.3],[.3,.46,.29,.26,.28,.29],
 ],
 C:[
  [0,.45,-.08,.66,.38,.43],
  [-.16,.77,-.12,.39,.41,.41],[.42,.73,-.12,.34,.39,.39],[-.48,.53,-.02,.32,.32,.38],
  [-.66,.29,.09,.29,.24,.31],[.65,.32,.07,.3,.28,.34],
  [-.30,.31,.31,.36,.31,.36],[.10,.22,.37,.39,.32,.38],[.47,.36,.29,.35,.36,.37],
  [-.11,.60,.26,.29,.31,.29],[.35,.61,.24,.27,.30,.3],
 ],
};

function smoothUnion(a:number,b:number,radius:number){
 const overlap=Math.max(radius-Math.abs(a-b),0)/radius;
 return Math.min(a,b)-overlap*overlap*radius*.25;
}

function cloudSurface(type:EnhancedCloudType){
 const lobes=CLOUD_LOBES[type],bounds=new THREE.Box3();
 for(const [x,y,z,rx,ry,rz] of lobes){
  bounds.expandByPoint(new THREE.Vector3(x-rx,y-ry,z-rz));
  bounds.expandByPoint(new THREE.Vector3(x+rx,y+ry,z+rz));
 }
 const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const field=(px:number,py:number,pz:number)=>{
  let distance=Infinity;
  for(const [lx,ly,lz,rx,ry,rz] of lobes){
   const dx=(px-lx)/rx,dy=(py-ly)/ry,dz=(pz-lz)/rz;
   const q=Math.sqrt(dx*dx+dy*dy+dz*dz);
   const d=(q-1)*Math.min(rx,ry,rz);
   distance=smoothUnion(distance,d,.055);
  }
  return distance;
 };
 // Fit a closed 320-face shell to the broad billows. Every vertex stays on
 // its original outward ray, so its sphere topology and winding survive the
 // fit. No edge collapse can open cracks or leave hanging triangular flaps.
 const geometry=new THREE.IcosahedronGeometry(1,3),positions=geometry.getAttribute('position');
 const direction=new THREE.Vector3(),point=new THREE.Vector3();
 for(let vertex=0;vertex<positions.count;vertex++){
  direction.fromBufferAttribute(positions,vertex).multiply(size).multiplyScalar(.5);
  let outside=2,inside=0;
  // Search inward for the outermost occupied point. This also fills narrow
  // internal creases between billows as part of one solid cloud envelope.
  for(let sample=79;sample>=0;sample--){
   const radius=sample/40;point.copy(center).addScaledVector(direction,radius);
   if(field(point.x,point.y,point.z)<=0){inside=radius;break;}outside=radius;
  }
  for(let iteration=0;iteration<16;iteration++){
   const radius=(inside+outside)/2;point.copy(center).addScaledVector(direction,radius);
   if(field(point.x,point.y,point.z)<=0)inside=radius;else outside=radius;
  }
  point.copy(center).addScaledVector(direction,(inside+outside)/2);
  positions.setXYZ(vertex,point.x,point.y,point.z);
 }
 geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}

const CLOUD_VERTEX_SHADER=`
 varying vec3 vCloudNormal;
 varying vec3 vCloudPosition;
 void main(){
  vCloudNormal=normalize(mat3(modelMatrix)*normal);
  vCloudPosition=position;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
 }
`;

const CLOUD_FRAGMENT_SHADER=`
 varying vec3 vCloudNormal;
 varying vec3 vCloudPosition;
 uniform vec2 cloudHeight;
 void main(){
  vec3 normal=normalize(vCloudNormal);
  float height=(vCloudPosition.y-cloudHeight.x)/cloudHeight.y;
  float light=dot(normal,normalize(vec3(-.35,.84,.42)));
  // Cloud tops scatter a great deal of light: only the lower-facing parts
  // carry blue-grey. There is no view-angle/Fresnel darkening at the rim.
  float lowerBody=1.0-smoothstep(.08,.46,height);
  float downFacing=1.0-smoothstep(-.50,.50,normal.y);
  float shade=lowerBody*(.25+.75*downFacing);
  vec3 upper=mix(vec3(.74,.83,.91),vec3(1.0),smoothstep(-.30,.72,light));
  vec3 underside=vec3(.29,.45,.58);
  gl_FragColor=vec4(mix(upper,underside,shade*.86),1.0);
  #include <colorspace_fragment>
 }
`;

/** A closed isosurface, not overlapping renderable pieces. Its silhouette is
 * scaled to the authored source proportions. It can enter the shared scenery
 * shadow pass as ordinary opaque geometry when approved for gameplay. */
export function createEnhancedCloudModel(shape:Shape,type?:EnhancedCloudType){
 const outline=enhancedCloudOutline(shape);
 if(outline.length<3)return new THREE.Group();
 const bounds=new THREE.Box2().setFromPoints(outline),sourceSize=new THREE.Vector2();bounds.getSize(sourceSize);
 const aspect=sourceSize.x/Math.max(sourceSize.y,1);
 const geometry=cloudSurface(type??(aspect>1.9?'A':aspect<1.5?'C':'B'));
 const rawBounds=geometry.boundingBox!,rawCenter=new THREE.Vector3(),rawSize=new THREE.Vector3();rawBounds.getCenter(rawCenter);rawBounds.getSize(rawSize);geometry.translate(-rawCenter.x,-rawCenter.y,-rawCenter.z);
 // Bake the nonuniform source fit into positions and normals. The lighting
 // direction then stays correct while the complete cloud turns in the viewer.
 geometry.scale(sourceSize.x/rawSize.x,sourceSize.y/rawSize.y,Math.max(210,sourceSize.y*.78)/rawSize.z);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const material=new THREE.ShaderMaterial({
  uniforms:{cloudHeight:{value:new THREE.Vector2(-sourceSize.y/2,sourceSize.y)}},
  vertexShader:CLOUD_VERTEX_SHADER,fragmentShader:CLOUD_FRAGMENT_SHADER,
  side:THREE.FrontSide,toneMapped:false,
 });
 const cloud=new THREE.Mesh(geometry,material),sourceCenter=new THREE.Vector2();bounds.getCenter(sourceCenter);
 cloud.position.set(sourceCenter.x,sourceCenter.y,0);
 cloud.castShadow=true;cloud.receiveShadow=false;cloud.userData.enhancedCloud=true;
 return cloud;
}
