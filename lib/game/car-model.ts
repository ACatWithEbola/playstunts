import {applyOriginalMaterialPattern,type OriginalMaterialPatterns} from './original-material-pattern.ts';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {CAR_STUDY_MATERIALS} from './car-study-materials.ts';
import {originalPrimitiveMaterial} from './primitive-record-header.ts';
import type {Shape} from './types';

export type OriginalPaint={paint:number;indices:readonly number[];palette:readonly number[];paletteMaterial?:number}&OriginalMaterialPatterns;

// Type-2 car primitives are authored rods and frame members. This is the
// three-pixel reference calibration (75% of the former four-pixel treatment).
// LineMaterial expands it in final race-world units, so it follows perspective
// and remains consistent across car0/car1 source scales.
const PERSPECTIVE_CAR_LINE_WIDTH=.421875;

function prioritizeCoplanarDetail(material:THREE.Material,layer:number){
 material.polygonOffset=true;material.polygonOffsetFactor=-layer;material.polygonOffsetUnits=-layer;
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);
  shader.uniforms.originalCarAttachedLayer={value:layer};
  shader.fragmentShader='uniform float originalCarAttachedLayer;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <logdepthbuf_fragment>',`#include <logdepthbuf_fragment>
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
   float originalCarDepthSlope=max(abs(dFdx(gl_FragDepth)),abs(dFdy(gl_FragDepth)));
   gl_FragDepth-=originalCarDepthSlope*0.5+originalCarAttachedLayer*0.000001;
#endif`);
 };
 const previousKey=key();material.customProgramCacheKey=()=>previousKey+'/original-car-attached-depth-v2';
}

function closeOriginalNsxWindowSeam(group:THREE.Group,shape:Shape,points:THREE.Vector3[]){
 const profiles=[
  [
   {indices:[119,143,145,121],expected:[[-300,260,240],[-300,320,-200],[-300,320,-320],[-300,340,-700]],side:-1},
   {indices:[120,144,146,122],expected:[[300,260,240],[300,320,-200],[300,320,-320],[300,340,-700]],side:1},
  ],
  [
   {indices:[72,94,96,86],expected:[[-15,12,18],[-15,14,-10],[-15,14,-16],[-15,15,-35]],side:-1},
   {indices:[73,95,97,87],expected:[[15,12,18],[15,14,-10],[15,14,-16],[15,15,-35]],side:1},
  ],
 ];
 const gaps=profiles.find(profile=>profile.every(gap=>gap.indices.every((index,i)=>shape.vertices[index]?.every((value,axis)=>value===gap.expected[i][axis]))));
 if(!gaps)return;
 const positions:number[]=[];
 for(const gap of gaps){
  const vertices=gap.indices.map(index=>points[index]);
  const triangles=gap.side<0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
  positions.push(...triangles.flatMap(index=>vertices[index].toArray()));
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const material=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,toneMapped:false});
 const filler=new THREE.Mesh(geometry,material);filler.userData.originalPresentationSeam='nsx-window';group.add(filler);
}

/** PMIN's detailed rear-wing end plates are authored as flat polygons. Give
 * both plates shallow physical thickness so their complete silhouettes remain
 * solid from oblique chase-camera angles instead of thickening selected edges. */
function addOriginalIndyRearWingEndPlateThickness(group:THREE.Group,shape:Shape,points:THREE.Vector3[],paint:OriginalPaint,originalColor:(material:number)=>number){
 // The full-detail Indy model is the only source car with a spherical driver
 // helmet. The former six-line signature described car1 and silently skipped
 // the car0 model now shared by the showroom and race renderer.
 if(shape.primitives.filter(primitive=>primitive.type===11).length!==1)return;
 const lateral=Math.max(...shape.vertices.map(vertex=>vertex[0]))-Math.min(...shape.vertices.map(vertex=>vertex[0]));
 const rear=Math.min(...shape.vertices.map(vertex=>vertex[2]));
 const wing=shape.primitives.find(primitive=>{
  if(primitive.type!==4||!(primitive.flags&1))return false;
  const vertices=primitive.indices.map(index=>shape.vertices[index]);
  const x=Math.max(...vertices.map(vertex=>vertex[0]))-Math.min(...vertices.map(vertex=>vertex[0]));
  const z=Math.max(...vertices.map(vertex=>vertex[2]));
  return x>=lateral*.5&&z<=rear+lateral*.25;
 });
 if(!wing)return;
 const wingVertices=new Set(wing.indices);
 const surfaces=shape.primitives.filter(primitive=>primitive.type>=3&&primitive.type<=10&&(primitive.flags&1)!==0&&primitive.indices.some(index=>wingVertices.has(index)));
 const endFins=surfaces.filter(primitive=>{
  const x=primitive.indices.map(index=>shape.vertices[index][0]);
  return Math.max(...x)===Math.min(...x);
 });
 // At the normal chase framing PMIN spans about 120 pixels in the original
 // raster. This proportion makes the former one-pixel plate roughly 1.5
 // pixels thick, adding the requested half pixel without changing its outline.
 const halfThickness=lateral/160/400;
 for(const primitive of endFins){
  const plate=primitive.indices.map(index=>points[index]);
  const positions:number[]=[];
  const pushTriangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3)=>positions.push(...a.toArray(),...b.toArray(),...c.toArray());
  const negative=plate.map(point=>point.clone().add(new THREE.Vector3(-halfThickness,0,0)));
  const positive=plate.map(point=>point.clone().add(new THREE.Vector3(halfThickness,0,0)));
  for(let at=1;at<plate.length-1;at++){
   pushTriangle(negative[0],negative[at+1],negative[at]);
   pushTriangle(positive[0],positive[at],positive[at+1]);
  }
  for(let at=0;at<plate.length;at++){
   const next=(at+1)%plate.length;
   pushTriangle(negative[at],positive[at],positive[next]);
   pushTriangle(negative[at],positive[next],negative[next]);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const primitiveIndex=shape.primitives.indexOf(primitive),sourceMaterial=primitive.materials[paint.paint];
  const material=new THREE.MeshBasicMaterial({color:originalColor(sourceMaterial),side:THREE.DoubleSide,toneMapped:false});
  const solidPlate=new THREE.Mesh(geometry,material);solidPlate.castShadow=true;solidPlate.receiveShadow=true;
  solidPlate.userData.originalPrimitive=primitiveIndex;solidPlate.userData.originalIndyRearWingEndPlate=true;group.add(solidPlate);
 }
}

/** Preserve source face sidedness: reverse-facing underbody panels must not cover the body.
 * Type 11 point separation is a diameter: the original circle raster halves it.
 * Use GPU facing at upgraded resolution; flag bit 0 retains genuinely two-sided panels. */
export function createCarModel(shape:Shape,color:number,originalPaint?:OriginalPaint,presentationFixes=true){
 const group=new THREE.Group();
 const resolvedMaterial=(material:number)=>originalPaint?.paletteMaterial===undefined?material:originalPrimitiveMaterial(material,originalPaint.paletteMaterial);
 const originalColor=(material:number)=>{
  const index=originalPaint!.indices[resolvedMaterial(material)],rgb=originalPaint!.palette;
  return (rgb[index*3]<<16)|(rgb[index*3+1]<<8)|rgb[index*3+2];
 };
 const points=shape.vertices.map(v=>new THREE.Vector3(v[0]/400,v[1]/400,v[2]/400));
 let attachedLayer=0;
 for(const p of shape.primitives){
  if(p.type>=3&&p.type<=10){
   const positions:number[]=[];
   for(let i=1;i<p.indices.length-1;i++)for(const n of [p.indices[0],p.indices[i],p.indices[i+1]])positions.push(...points[n].toArray());
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   geometry.computeVertexNormals();
   const sourceMaterial=p.materials[0];let surfaceColor=color;
   if(sourceMaterial===0||sourceMaterial===38||sourceMaterial===44)surfaceColor=0x101720;
   else if([7,15,18,96,97].includes(sourceMaterial))surfaceColor=0xd1d6d9;
   else if([16,17,40,41,42,43,76,77,78,79].includes(sourceMaterial))surfaceColor=0x223d51;
   else if([4,12,45,46,47,127].includes(sourceMaterial))surfaceColor=0xe34432;
   if(originalPaint){
    const index=originalPaint.indices[resolvedMaterial(p.materials[originalPaint.paint])],rgb=originalPaint.palette;
    surfaceColor=(rgb[index*3]<<16)|(rgb[index*3+1]<<8)|rgb[index*3+2];
   }
   const material=originalPaint
    ?new THREE.MeshBasicMaterial({color:surfaceColor,side:(p.flags&1)?THREE.DoubleSide:THREE.FrontSide,toneMapped:false})
    :new THREE.MeshStandardMaterial({color:surfaceColor,...CAR_STUDY_MATERIALS.body,side:THREE.DoubleSide,flatShading:true});
   if(originalPaint&&material instanceof THREE.MeshBasicMaterial)applyOriginalMaterialPattern(material,geometry,Array(positions.length/3).fill(resolvedMaterial(p.materials[originalPaint.paint])),originalPaint);
   const layer=p.flags&2?++attachedLayer:(attachedLayer=0);
   if(layer)prioritizeCoplanarDetail(material,layer);
   const node=new THREE.Mesh(geometry,material);
   node.castShadow=true;node.receiveShadow=true;node.userData.originalBodyFace=true;node.userData.originalPrimitive=shape.primitives.indexOf(p);node.userData.originalAttachedLayer=layer;group.add(node);
  }else if(originalPaint&&p.type===2){
   const geometry=new LineSegmentsGeometry();geometry.setPositions(p.indices.flatMap(i=>points[i].toArray()));
   // Give rods and frame members physical thickness. Their screen footprint
   // now grows nearby and recedes with distance like the surrounding car.
   const line=new LineSegments2(geometry,new LineMaterial({color:originalColor(p.materials[originalPaint.paint]),linewidth:PERSPECTIVE_CAR_LINE_WIDTH,worldUnits:true,toneMapped:false,side:THREE.DoubleSide}));
   line.userData.originalCarLine=true;line.userData.originalPrimitive=shape.primitives.indexOf(p);group.add(line);
  }else if(originalPaint&&p.type===11){
   const center=points[p.indices[0]],radius=center.distanceTo(points[p.indices[1]])/2;
   const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]),toneMapped:false}));
   sphere.position.copy(center);group.add(sphere);
  }else if(p.type===12){
   const a=points[p.indices[0]],b=points[p.indices[3]],radius=a.distanceTo(points[p.indices[1]]),depth=a.distanceTo(b);
   const wheelGeometry=new THREE.CylinderGeometry(radius,radius,depth,24);
   const wheelMaterial=originalPaint
    // Keep both tire walls black. The separate smaller hub cylinder supplies
    // the grey centre; colouring the whole wheel caps grey produced a large
    // patch whenever a steered front wheel faced the chase camera.
    ?new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]),toneMapped:false})
    :new THREE.MeshStandardMaterial({color:0x101318,...CAR_STUDY_MATERIALS.tire});
   const wheel=new THREE.Mesh(wheelGeometry,wheelMaterial);
   wheel.position.copy(a).add(b).multiplyScalar(.5);
   wheel.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
   wheel.castShadow=true;wheel.userData.originalWheelPart='tire';group.add(wheel);
   const hubMaterial=originalPaint
    ?new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]+2),toneMapped:false})
    :new THREE.MeshStandardMaterial({color:0x9fadb7,...CAR_STUDY_MATERIALS.hub});
   prioritizeCoplanarDetail(hubMaterial,1);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(radius*(originalPaint?0x2500/16384:.56),radius*(originalPaint?0x2500/16384:.56),depth,12),hubMaterial);
   hub.position.copy(wheel.position);hub.quaternion.copy(wheel.quaternion);hub.userData.originalWheelPart='hub';group.add(hub);
  }
 }
 if(presentationFixes){
  if(originalPaint)addOriginalIndyRearWingEndPlateThickness(group,shape,points,originalPaint,originalColor);
  closeOriginalNsxWindowSeam(group,shape,points);
 }
 return group;
}

/** The showroom car0 meshes were authored for their fixed presentation angle;
 * several omit parts of the lower shell that become visible after a rollover.
 * Reuse the complete authored car1 underbody quilt (materials 8, 92 and 93)
 * wherever its winding faces below the car. This includes the floor plus the
 * sloped nose and tail closures the original rasterizer shows from low angles.
 * Do not nest the complete coarse car, because its upper body would overlap the
 * detailed car0 exterior. */
export function createOriginalCarUnderbodyModel(shape:Shape,color:number,originalPaint:OriginalPaint){
 const underbodyMaterials=new Set([8,92,93]);
 const primitives=shape.primitives.filter(primitive=>{
  if(primitive.type<3||primitive.type>10||primitive.indices.length<3)return false;
  if(!primitive.materials.every(material=>underbodyMaterials.has(material)))return false;
  const [a,b,c]=primitive.indices.slice(0,3).map(index=>shape.vertices[index]);
  const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  return ab[2]*ac[0]-ab[0]*ac[2]<0;
 });
 if(!primitives.length)return;
 const underbodyShape:Shape={...shape,primitives};
 // This child must contain only the selected lower-shell faces. Presentation
 // fillers (notably the NSX window seam) belong to the detailed exterior and
 // would otherwise be duplicated from the coarse racing shape.
 return {model:createCarModel(underbodyShape,color,originalPaint,false),shape:underbodyShape};
}
