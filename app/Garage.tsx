'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Button} from '@/components/ui/button';
import type {Assets,Primitive,Shape} from '@/lib/game/types';
import {createShowroomCarModel} from '@/lib/game/showroom-car-model';
import {addUpgradedCarStudyLights} from '@/lib/game/upgraded-car-materials';
import {createUpgradedRetroLighting} from '@/lib/game/upgraded-retro-lighting';
import {SHOWROOM_SUN,SHOWROOM_SHADOW_WORLD_SCALE} from '@/lib/game/showroom-lighting';
import trackMaterials from '@/public/game/track-materials.json';

function primitiveArea(shape:Shape,primitive:Primitive){
 const origin=new THREE.Vector3(...shape.vertices[primitive.indices[0]]),area=new THREE.Vector3();
 for(let i=1;i<primitive.indices.length-1;i++){
  const a=new THREE.Vector3(...shape.vertices[primitive.indices[i]]).sub(origin);
  const b=new THREE.Vector3(...shape.vertices[primitive.indices[i+1]]).sub(origin);
  area.add(a.cross(b));
 }
 return area.length();
}

/** Find the authored paint-changing body panel rather than imposing generic
 * showroom swatches. This preserves each car's original visual footprint. */
function sourcePaintColors(shape:Shape){
 let body:Primitive|undefined,bestArea=-1;
 for(const primitive of shape.primitives){
  if(primitive.type<3||primitive.type>10||primitive.materials.length<5||new Set(primitive.materials.slice(0,5)).size<2)continue;
  const area=primitiveArea(shape,primitive);if(area>bestArea){bestArea=area;body=primitive;}
 }
 return Array.from({length:5},(_,paint)=>{
  const material=body?.materials[paint]??0,index=trackMaterials.indices[material]??0;
  return (trackMaterials.palette[index*3]<<16)|(trackMaterials.palette[index*3+1]<<8)|trackMaterials.palette[index*3+2];
 });
}

function disposeObject(object:THREE.Object3D){
 object.traverse(node=>{
  if(!(node instanceof THREE.Mesh)&&!(node instanceof THREE.Line))return;
  node.geometry.dispose();
  const materials=Array.isArray(node.material)?node.material:[node.material];
  materials.forEach(material=>material.dispose());
 });
}

function carSpecifications(description:string){
 const lines=description.split('\n'),start=lines.findIndex(line=>/\bEngine,/.test(line));
 return lines.slice(start<0?1:start).filter(Boolean).join('\n');
}

export default function Garage({assets}:{assets:Assets}){
 const [selected,setSelected]=useState(0),[paint,setPaint]=useState(0);
 const host=useRef<HTMLDivElement>(null),sceneRef=useRef<THREE.Scene|null>(null),modelRef=useRef<THREE.Group|null>(null);
 const shadowDirty=useRef(true);
 const car=assets.cars[selected],shapes=assets.shapes['ST'+car.id],shape=shapes?.car0,raceShape=shapes?.car1;
 const colors=useMemo(()=>shape?sourcePaintColors(shape):[0xe7bd32,0xd54937,0x267fa8,0xdadfdd,0x314639],[shape]);

 useEffect(()=>{
  const element=host.current;if(!element)return;
  let renderer:THREE.WebGLRenderer;
  // Attached source details such as the Ferrari GTO's inset rear lenses use
  // the same logarithmic-depth correction as the upgraded game renderers.
  try{renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});}
  catch{
   element.textContent='3D rendering is unavailable in this browser. The original game is still available.';
   return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=false;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();sceneRef.current=scene;scene.background=new THREE.Color(0x101b25);scene.fog=new THREE.Fog(0x101b25,16,36);
  const camera=new THREE.PerspectiveCamera(36,1,.05,100);camera.position.set(6,3.1,7);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.6,0);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=16;controls.maxPolarAngle=Math.PI*.48;
  addUpgradedCarStudyLights(scene,SHOWROOM_SUN);
  const retroLighting=createUpgradedRetroLighting({sunDirection:SHOWROOM_SUN,worldScale:SHOWROOM_SHADOW_WORLD_SCALE});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:0x172731,toneMapped:false}));floor.rotation.x=-Math.PI/2;floor.userData.retroDistanceColour=false;scene.add(floor);retroLighting.apply(floor,true,false);
  const grid=new THREE.GridHelper(40,40,0x47606a,0x243942);grid.position.y=.002;grid.userData.originalEdgeVisibility=true;scene.add(grid);
  element.appendChild(renderer.domElement);
  const resize=()=>{const width=element.clientWidth,height=element.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(element);resize();renderer.setAnimationLoop(()=>{controls.update();if(shadowDirty.current&&modelRef.current){retroLighting.drawShadows(renderer,[modelRef.current],scene);shadowDirty.current=false;}renderer.render(scene,camera);});
  return()=>{observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();sceneRef.current=null;modelRef.current=null;retroLighting.dispose();disposeObject(scene);renderer.dispose();renderer.domElement.remove();};
 },[]);

 useEffect(()=>{
  const scene=sceneRef.current;if(!scene||!shape)return;
  if(modelRef.current){scene.remove(modelRef.current);disposeObject(modelRef.current);}
  // The original car-menu raster substitutes material 45 with its active
  // display palette (black here) before resolving colour and stipple tables.
  const model=createShowroomCarModel(shape,raceShape,{paint,indices:trackMaterials.indices,palette:trackMaterials.palette,paletteMaterial:0});
  scene.add(model);modelRef.current=model;shadowDirty.current=true;
 },[car.id,paint,raceShape,shape]);

 const changeCar=(offset:number)=>{setSelected((selected+offset+assets.cars.length)%assets.cars.length);setPaint(0);};
 return <section className="garage"><div className="garage-top"><span>3D car showroom · detailed selection geometry, upgraded materials</span></div><div className="garage-layout"><div className="garage-view" ref={host}><span className="orbit-hint">Drag to rotate · scroll to zoom</span></div><aside><div className="car-heading"><p className="eyebrow">{String(selected+1).padStart(2,'0')} / {assets.cars.length}</p><h2>{car.name}</h2></div><p className="car-description">{carSpecifications(car.description)}</p><div className="car-controls"><div className="paints" aria-label="Preview paint colour">{colors.map((colour,index)=><button key={`${colour}-${index}`} aria-label={`Paint colour ${index+1}`} aria-pressed={paint===index} onClick={()=>setPaint(index)} style={{background:'#'+colour.toString(16).padStart(6,'0')}} />)}</div><div className="car-nav"><Button variant="outline" onClick={()=>changeCar(-1)}>← Previous</Button><Button variant="outline" onClick={()=>changeCar(1)}>Next →</Button></div></div><p className="fine">The showroom uses the detailed models from the in-game car selection, including their source colours, lamps, directional panels, upgraded lighting and filtered shadows.</p></aside></div></section>;
}
