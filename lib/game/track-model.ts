import {applyOriginalMaterialPattern,type OriginalMaterialPatterns} from './original-material-pattern.ts';
import {attachedRoadTriangles,type Point3} from './attached-road-triangles.ts';
import * as THREE from 'three';
import {originalPolygonNeedsDepthSort} from './polygon-order.ts';
import type {Shape} from './types.ts';
export type TrackMaterials={indices:number[];palette:number[]}&OriginalMaterialPatterns;
export function createTrackModel(shape: Shape,trackMaterials:TrackMaterials,paint=0,terrainUnderlay=false) {
  const patternMaterials:number[]=[],curbPriorities:number[]=[];
  const vertices:number[]=[],colors:number[]=[],normals:number[]=[],layers:number[]=[],parentPlanes:number[]=[],lines:number[]=[],lineColors:number[]=[];
  let parentPoints:Point3[]=[];
  let parentPlane:number[]=[0,0,0,0],attachedLayer=0;
  const lineRanges:{primitive:number;start:number;count:number}[]=[];
  const primitiveRanges:{primitive:number;start:number;count:number}[]=[];
  for(const [primitiveIndex,primitive] of shape.primitives.entries()){
    const material=primitive.materials[paint];
    if(material===undefined)throw Error('Original track paint variant is missing');
    const index=trackMaterials.indices[material];
    if(index===undefined)throw Error(`Unknown original material ${material}`);
    const rgb=trackMaterials.palette.slice(index*3,index*3+3);
    const color=new THREE.Color((rgb[0]<<16)|(rgb[1]<<8)|rgb[2]);
    const append=(index:number,positions:number[],shades:number[])=>{
      positions.push(...shape.vertices[index]);shades.push(color.r,color.g,color.b);
    };
    if(primitive.type===2){const start=lines.length/3;for(const index of primitive.indices)append(index,lines,lineColors);lineRanges.push({primitive:primitiveIndex,start,count:lines.length/3-start});continue;}
    if(primitive.type<3||primitive.type>10)continue;
    const points=primitive.indices.map(index=>new THREE.Vector3(...shape.vertices[index]));
    const normal=new THREE.Vector3();
    for(let i=1;i<points.length-1&&!normal.lengthSq();i++)normal.crossVectors(points[i].clone().sub(points[0]),points[i+1].clone().sub(points[0]));
    normal.normalize();
    const faceNormal=normal.clone();
    const firstNonzero=[normal.x,normal.y,normal.z].find(n=>Math.abs(n)>1e-8)??0;
    if(firstNonzero<0)normal.negate();
    const attached=!originalPolygonNeedsDepthSort(0,primitive.flags);
    if(!attached){parentPoints=primitive.indices.map(index=>shape.vertices[index] as Point3);parentPlane=[normal.x,normal.y,normal.z,normal.dot(points[0])];attachedLayer=0;}
    const layer=attached?++attachedLayer:0;
    const depthPlane=attached?parentPlane:[0,0,0,0];
    const start=vertices.length/3;
    // Ear clipping preserves concave planar outlines (notably fork junctions).
    // Keep the original diagonal for warped faces and convex polygons.
    const axes=[0,1,2].filter(i=>i!==[Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z)].indexOf(Math.max(Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z))));
    const contour=points.map(p=>new THREE.Vector2(p.getComponent(axes[0]),p.getComponent(axes[1])));
    const turns=contour.map((p,i)=>{const q=contour[(i+1)%contour.length],r=contour[(i+2)%contour.length];return (q.x-p.x)*(r.y-q.y)-(q.y-p.y)*(r.x-q.x);});
    const concave=turns.some(t=>t>1e-6)&&turns.some(t=>t< -1e-6);
    const planar=points.every(p=>Math.abs(normal.dot(p.clone().sub(points[0])))<1e-6);
    const triangles=concave&&planar?THREE.ShapeUtils.triangulateShape(contour,[]):primitive.indices.slice(1,-1).map((_,i)=>[0,i+1,i+2]);
    for(const indices of triangles){
      const triangle=indices.map(index=>shape.vertices[primitive.indices[index]] as Point3);
      const fragments=attached?attachedRoadTriangles(triangle,parentPoints,depthPlane):[{points:triangle,plane:depthPlane}];
      for(const fragment of fragments)for(const point of fragment.points){curbPriorities.push(material===127||material===128?1:0);patternMaterials.push(material);vertices.push(...point);colors.push(color.r,color.g,color.b);normals.push(faceNormal.x,faceNormal.y,faceNormal.z);layers.push(layer);parentPlanes.push(...fragment.plane);}
    }
    primitiveRanges.push({primitive:primitiveIndex,start,count:vertices.length/3-start});
  }
  const group=new THREE.Group();
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('originalParentPlane',new THREE.Float32BufferAttribute(parentPlanes,4));geometry.setAttribute('originalLayer',new THREE.Float32BufferAttribute(layers,1));
  geometry.setAttribute('originalCurbPriority',new THREE.Float32BufferAttribute(curbPriorities,1));
  geometry.userData.originalPrimitiveRanges=primitiveRanges;
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false});
  // Original material tables already supply the face shades. Additional
  // directional lighting introduces false diagonal bands on banked roads.
  // Original attached details stay with their parent. Apply priority only
  // to explicit attached flags, never to independent coplanar road surfaces.
  // Account for the pixel depth slope as well as rounding: a fixed tiny offset
  // still lets multisample depths cross at oblique road and window edges.
  material.onBeforeCompile=shader=>{
    const varyings='varying float vOriginalCurbPriority; varying float vOriginalLayer; varying vec4 vOriginalParentPlane; varying vec3 vOriginalViewPosition;\n';
    shader.vertexShader='attribute float originalCurbPriority; attribute float originalLayer; attribute vec4 originalParentPlane; '+varyings+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOriginalLayer = originalLayer; vOriginalCurbPriority = originalCurbPriority;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vOriginalViewPosition = mvPosition.xyz;
      vOriginalParentPlane = vec4(0.0);
      if (length(originalParentPlane.xyz) > 0.5) {
        vec3 parentNormal = normalize(normalMatrix * originalParentPlane.xyz);
        vec3 parentPoint = (modelViewMatrix * vec4(originalParentPlane.xyz * originalParentPlane.w, 1.0)).xyz;
        vOriginalParentPlane = vec4(parentNormal, dot(parentNormal, parentPoint));
      }`);
    shader.fragmentShader=varyings+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <logdepthbuf_fragment>',`#include <logdepthbuf_fragment>
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
      if (length(vOriginalParentPlane.xyz) > 0.5) {
        float denominator = dot(vOriginalParentPlane.xyz, vOriginalViewPosition);
        if (abs(denominator) > 0.000001) {
          float parentDepth = -vOriginalViewPosition.z * vOriginalParentPlane.w / denominator;
          if (parentDepth > 0.0) gl_FragDepth = min(gl_FragDepth, log2(1.0 + parentDepth) * logDepthBufFC * 0.5);
        }
      }
      float originalDepthSlope = max(abs(dFdx(gl_FragDepth)), abs(dFdy(gl_FragDepth)));
      // Materials 127/128 are the original coplanar red/white curbs.
      // Resolve their road-depth tie without changing source geometry.
      gl_FragDepth -= vOriginalCurbPriority * 0.000001;
      gl_FragDepth -= min(vOriginalLayer, 1.0) * originalDepthSlope * 0.5 + vOriginalLayer * 0.000001;
      // Original terrain is submitted beneath the road. Keep the
      // original coincident vertices; resolve only their GPU depth tie.
      gl_FragDepth += ${terrainUnderlay ? 'originalDepthSlope * 0.5 + 0.000001' : '0.0'};
#endif`);
  };
  material.customProgramCacheKey=()=> `original-track-attached-depth-v8-${terrainUnderlay ? 'terrain' : 'object'}`;
  applyOriginalMaterialPattern(material,geometry,patternMaterials,trackMaterials);
  group.add(new THREE.Mesh(geometry,material));
  if(lines.length){const geometry=new THREE.BufferGeometry();geometry.userData.originalPrimitiveRanges=lineRanges;geometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(lineColors,3));group.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({vertexColors:true})));}
  return group;
}

/** Per-scene prototypes share immutable GPU resources between repeated tiles.
 * Each placement still owns its transform and visibility, including paint animation.
 */
export function createTrackModelFactory(materials:TrackMaterials){
 const models=new Map<Shape,Map<number,THREE.Group>>();
 return (shape:Shape,paint=0,terrainUnderlay=false)=>{
  const key=paint*2+Number(terrainUnderlay);
  let paints=models.get(shape);if(!paints){paints=new Map();models.set(shape,paints);}
  let prototype=paints.get(key);
  if(!prototype){prototype=createTrackModel(shape,materials,paint,terrainUnderlay);paints.set(key,prototype);}
  return prototype.clone(true);
 };
}
