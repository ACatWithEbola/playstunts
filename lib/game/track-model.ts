import {applyOriginalMaterialPattern,type OriginalMaterialPatterns} from './original-material-pattern.ts';
import {attachedRoadTriangles,type Point3} from './attached-road-triangles.ts';
import {roadMarkingSurfaces,roadMarkingSurfaceFragments} from './road-marking-projection.ts';
import {createCarModel} from './car-model.ts';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {originalPolygonNeedsDepthSort} from './polygon-order.ts';
import {upgradedOriginalEdgeSegments} from './upgraded-original-edge-visibility.ts';
import type {Shape} from './types.ts';
export type TrackMaterials={indices:number[];palette:number[]}&OriginalMaterialPatterns;
// The native material table already contains the intended road colours. These
// are the asphalt/dirt/ice deck and centre-line variants used by road models;
// directional face shading would otherwise turn adjoining bank triangles into
// visibly different colours.
const ROAD_SURFACE_MATERIALS=new Set([19,21,23,24,25,27,28,30]);
const ROAD_MARKING_MATERIALS=new Set([21,24,27,30]);
const TERRAIN_SURFACE_MATERIALS=new Set([101,102]);
/** Physical diameter for authored scenery lines and retained edge traces.
 * Unlike the former four-pixel strip, this is measured in track-world units
 * and therefore grows nearby and recedes naturally with perspective. */
export const PERSPECTIVE_TRACK_LINE_WIDTH=6;
export function createTrackModel(shape: Shape,trackMaterials:TrackMaterials,paint=0,terrainUnderlay=false,worldLineWidth=0) {
  const patternMaterials:number[]=[],curbPriorities:number[]=[],roadSurfaces:number[]=[],terrainSurfaces:number[]=[],roadMarkings:number[]=[];
  const markingSurfaces=roadMarkingSurfaces(shape,paint);
  const vertices:number[]=[],colors:number[]=[],normals:number[]=[],layers:number[]=[],parentPlanes:number[]=[],lines:number[]=[],lineColors:number[]=[],edgeLines:number[]=[],edgeLineColors:number[]=[];
  const originalEdgeSegments=upgradedOriginalEdgeSegments(shape),edgeSegmentsByPrimitive=new Map<number,typeof originalEdgeSegments>();
  for(const segment of originalEdgeSegments){const segments=edgeSegmentsByPrimitive.get(segment.primitive);if(segments)segments.push(segment);else edgeSegmentsByPrimitive.set(segment.primitive,[segment]);}
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
    for(const edge of edgeSegmentsByPrimitive.get(primitiveIndex)??[]){append(edge.start,edgeLines,edgeLineColors);append(edge.end,edgeLines,edgeLineColors);}
    const points=primitive.indices.map(index=>new THREE.Vector3(...shape.vertices[index]));
    const normal=new THREE.Vector3();
    for(let i=1;i<points.length-1&&!normal.lengthSq();i++)normal.crossVectors(points[i].clone().sub(points[0]),points[i+1].clone().sub(points[0]));
    normal.normalize();
    const faceNormal=normal.clone();
    const firstNonzero=[normal.x,normal.y,normal.z].find(n=>Math.abs(n)>1e-8)??0;
    if(firstNonzero<0)normal.negate();
    const attached=!originalPolygonNeedsDepthSort(0,primitive.flags);
    const roadSurface=ROAD_SURFACE_MATERIALS.has(material);
    const terrainSurface=TERRAIN_SURFACE_MATERIALS.has(material);
    const roadMarking=ROAD_MARKING_MATERIALS.has(material)&&attached&&points.length===4;
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
      const attachedFragments=attached?attachedRoadTriangles(triangle,parentPoints,depthPlane):[{points:triangle,plane:depthPlane}];
      const fragments=roadMarking?roadMarkingSurfaceFragments(triangle,markingSurfaces,attachedFragments):attachedFragments;
      for(const fragment of fragments)for(const point of fragment.points){
        curbPriorities.push(material===127||material===128?1:0);patternMaterials.push(material);roadSurfaces.push(Number(roadSurface));terrainSurfaces.push(Number(terrainSurface));roadMarkings.push(Number(roadMarking));
        vertices.push(...point);colors.push(color.r,color.g,color.b);normals.push(faceNormal.x,faceNormal.y,faceNormal.z);layers.push(layer);parentPlanes.push(...fragment.plane);
      }
    }
    primitiveRanges.push({primitive:primitiveIndex,start,count:vertices.length/3-start});
  }
  const group=new THREE.Group();
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('originalParentPlane',new THREE.Float32BufferAttribute(parentPlanes,4));geometry.setAttribute('originalLayer',new THREE.Float32BufferAttribute(layers,1));
  geometry.setAttribute('originalCurbPriority',new THREE.Float32BufferAttribute(curbPriorities,1));
  geometry.setAttribute('originalRoadSurface',new THREE.Float32BufferAttribute(roadSurfaces,1));
  geometry.setAttribute('originalTerrainSurface',new THREE.Float32BufferAttribute(terrainSurfaces,1));
  geometry.setAttribute('originalRoadMarking',new THREE.Float32BufferAttribute(roadMarkings,1));
  geometry.userData.originalPrimitiveRanges=primitiveRanges;
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false});
  // Original material tables already supply the face shades. Additional
  // directional lighting introduces false diagonal bands on banked roads.
  // Original attached details stay with their parent. Apply priority only
  // to explicit attached flags, never to independent coplanar road surfaces.
  // Account for the pixel depth slope as well as rounding: a fixed tiny offset
  // still lets multisample depths cross at oblique road and window edges.
  material.onBeforeCompile=shader=>{
    const varyings='varying float vOriginalCurbPriority; varying float vOriginalLayer; varying float vOriginalRoadSurface; varying float vOriginalTerrainSurface; varying float vOriginalRoadMarking; varying vec4 vOriginalParentPlane; varying vec3 vOriginalViewPosition;\n';
    shader.vertexShader='attribute float originalCurbPriority; attribute float originalLayer; attribute float originalRoadSurface; attribute float originalTerrainSurface; attribute float originalRoadMarking; attribute vec4 originalParentPlane; '+varyings+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOriginalLayer = originalLayer; vOriginalCurbPriority = originalCurbPriority; vOriginalRoadSurface = originalRoadSurface; vOriginalTerrainSurface = originalTerrainSurface; vOriginalRoadMarking = originalRoadMarking;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      if (originalRoadMarking > .5) {
        // Source integer paint quads can be horizontally flat on banked
        // asphalt. Preserve their XZ station/length, with their actual road
        // triangle supplying presentation height and banking.
        if(abs(originalParentPlane.y)>.05){
          transformed.y=(originalParentPlane.w-dot(originalParentPlane.xz,transformed.xz))/originalParentPlane.y;
        }
        mvPosition=modelViewMatrix*vec4(transformed,1.0);gl_Position=projectionMatrix*mvPosition;
      }
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
      // Markings use the same attached-surface priority as other painted
      // details; no widening-specific depth bias can expose them through objects.
      // Original terrain is submitted beneath the road. Keep the
      // original coincident vertices; resolve only their GPU depth tie.
      gl_FragDepth += ${terrainUnderlay ? 'originalDepthSlope * 0.5 + 0.000001' : '0.0'};
#endif`);
  };
  material.customProgramCacheKey=()=> `original-track-attached-depth-v13-${terrainUnderlay ? 'terrain' : 'object'}`;
  applyOriginalMaterialPattern(material,geometry,patternMaterials,trackMaterials);
  group.add(new THREE.Mesh(geometry,material));
  if(lines.length){
   if(worldLineWidth>0){
    const geometry=new LineSegmentsGeometry();geometry.setPositions(lines);geometry.setColors(lineColors);
    // Give cables and other authored line primitives physical thickness.
    // World-unit expansion preserves their endpoints while allowing the
    // perspective camera to make distant lines thinner than nearby ones.
    const line=new LineSegments2(geometry,new LineMaterial({vertexColors:true,linewidth:worldLineWidth,worldUnits:true,side:THREE.DoubleSide,toneMapped:false}));
    line.userData.originalTrackLine=true;group.add(line);
   }else{
    const geometry=new THREE.BufferGeometry();geometry.userData.originalPrimitiveRanges=lineRanges;geometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(lineColors,3));group.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({vertexColors:true,toneMapped:false})));
   }
  }
  if(edgeLines.length){
   const geometry=new LineSegmentsGeometry();geometry.setPositions(edgeLines);geometry.setColors(edgeLineColors);
   // These traces retain authored thin walls at edge-on angles. They share the
   // physical width of source line primitives instead of a fixed pixel width,
   // so rails and wall edges also obey perspective at every camera distance.
   // Keep both sides because the upgraded world mirrors source Z.
   const edges=new LineSegments2(geometry,new LineMaterial({vertexColors:true,linewidth:PERSPECTIVE_TRACK_LINE_WIDTH,worldUnits:true,side:THREE.DoubleSide,toneMapped:false}));edges.userData.originalEdgeVisibility=true;group.add(edges);
  }
  // The transporter uses the same native type-12 wheels as cars. Reuse their
  // tire/cap/hub presentation and undo the car adapter's 1/400 unit scale.
  const wheelPrimitives=shape.primitives.filter(primitive=>primitive.type===12);
  if(wheelPrimitives.length){
    const wheels=createCarModel({...shape,primitives:wheelPrimitives},0xffffff,{...trackMaterials,paint});
    wheels.scale.setScalar(400);group.add(wheels);
  }
  return group;
}

/** Per-scene prototypes share immutable GPU resources between repeated tiles.
 * Each placement still owns its transform and visibility, including paint animation.
 */
export function createTrackModelFactory(materials:TrackMaterials,sourceLineWorldWidth=0){
 const models=new Map<Shape,Map<string,THREE.Group>>();
 return (shape:Shape,paint=0,terrainUnderlay=false,worldLineWidth=sourceLineWorldWidth)=>{
  const key=paint+'/'+Number(terrainUnderlay)+'/'+worldLineWidth;
  let paints=models.get(shape);if(!paints){paints=new Map();models.set(shape,paints);}
  let prototype=paints.get(key);
  if(!prototype){prototype=createTrackModel(shape,materials,paint,terrainUnderlay,worldLineWidth);paints.set(key,prototype);}
  return prototype.clone(true);
 };
}
