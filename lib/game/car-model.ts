import {applyOriginalMaterialPattern,type OriginalMaterialPatterns} from './original-material-pattern.ts';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {CAR_STUDY_MATERIALS} from './car-study-materials.ts';
import {originalPrimitiveMaterial} from './primitive-record-header.ts';
import type {Shape} from './types';

type OriginalPaint={paint:number;indices:readonly number[];palette:readonly number[];paletteMaterial?:number}&OriginalMaterialPatterns;

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

/** Preserve source face sidedness: reverse-facing underbody panels must not cover the body.
 * Type 11 point separation is a diameter: the original circle raster halves it.
 * Use GPU facing at upgraded resolution; flag bit 0 retains genuinely two-sided panels. */
export function createCarModel(shape:Shape,color:number,originalPaint?:OriginalPaint){
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
   // One source line pixel at 320x200 is four pixels in the upgraded canvas.
   // Screen-space width retains that footprint without moving its endpoints.
   const line=new LineSegments2(geometry,new LineMaterial({color:originalColor(p.materials[originalPaint.paint]),linewidth:4,toneMapped:false,side:THREE.DoubleSide}));
   line.userData.originalCarLine=true;line.userData.originalPrimitive=shape.primitives.indexOf(p);group.add(line);
  }else if(originalPaint&&p.type===11){
   const center=points[p.indices[0]],radius=center.distanceTo(points[p.indices[1]])/2;
   const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]),toneMapped:false}));
   sphere.position.copy(center);group.add(sphere);
  }else if(p.type===12){
   const a=points[p.indices[0]],b=points[p.indices[3]],radius=a.distanceTo(points[p.indices[1]]),depth=a.distanceTo(b);
   const wheelGeometry=new THREE.CylinderGeometry(radius,radius,depth,24);
   const wheelMaterial=originalPaint
    ?[
      new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]),toneMapped:false}),
      new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]+1),toneMapped:false}),
      new THREE.MeshBasicMaterial({color:originalColor(p.materials[originalPaint.paint]+1),toneMapped:false}),
     ]
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
 closeOriginalNsxWindowSeam(group,shape,points);
 return group;
}
