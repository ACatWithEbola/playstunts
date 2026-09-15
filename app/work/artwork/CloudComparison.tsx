'use client';

import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import type {Assets,Shape} from '@/lib/game/types';
import {loadBrowserNativeDemoData} from '@/lib/game/browser-native-demo';
import {createNativeManualRaceRuntime} from '@/lib/game/native-manual-race-runtime';
import {readUpgradedShape} from '@/lib/game/upgraded-submission';
import {readOriginalMaterialPatterns} from '@/lib/game/original-material-pattern';
import {createTrackModel,type TrackMaterials} from '@/lib/game/track-model';
import {createEnhancedCloudModel,type EnhancedCloudType} from '@/lib/game/enhanced-cloud-model';

type PreviewKind='current'|'candidate';

function CloudCanvas({shape,materials,kind,type,fullTurn}:{shape:Shape;materials:TrackMaterials;kind:PreviewKind;type:EnhancedCloudType;fullTurn:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  const renderer=new THREE.WebGLRenderer({canvas:element,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x58e1e7);
  scene.add(new THREE.HemisphereLight(0xffffff,kind==='candidate'?0xe5eced:0x7d8c98,kind==='candidate'?1.1:2.35));
  const sun=new THREE.DirectionalLight(kind==='candidate'?0xffffff:0xfff4d8,kind==='candidate'?.65:3.1);sun.position.set(-1800,2400,2600);scene.add(sun);
  const model=kind==='current'?createTrackModel(shape,materials):createEnhancedCloudModel(shape,type);scene.add(model);
  const box=new THREE.Box3().setFromObject(model),center=new THREE.Vector3(),size=new THREE.Vector3();box.getCenter(center);box.getSize(size);model.position.sub(center);
  const camera=new THREE.PerspectiveCamera(35,1,1,20000),span=Math.max(size.x,size.y,1);camera.position.set(0,-span*.08,span*1.65);camera.lookAt(0,0,0);
  let frame=0,disposed=false;
  const resize=()=>{const width=Math.max(1,element.clientWidth),height=Math.max(1,element.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(element);resize();
  const start=performance.now();
  const render=(now:number)=>{if(disposed)return;model.rotation.y=fullTurn?(now-start)*.0007:Math.sin(now*.00034)*.34;model.rotation.x=-.11;renderer.render(scene,camera);frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){object.geometry?.dispose();const objectMaterials=Array.isArray(object.material)?object.material:[object.material];objectMaterials.forEach(material=>material?.dispose());}});renderer.dispose();};
 },[kind,materials,shape,type,fullTurn]);
 return <canvas ref={canvas} aria-label={`${kind==='current'?'Previous':'Active enhanced'} cloud model preview`}/>;
}

export default function CloudComparison(){
 const [clouds,setClouds]=useState<Shape[]>([]),[materials,setMaterials]=useState<TrackMaterials>(),[selected,setSelected]=useState(0),[error,setError]=useState('');
 const [fullTurn,setFullTurn]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void (async()=>{
   try{
    const [assetsResponse,materialsResponse]=await Promise.all([fetch('/game/assets.json',{signal:controller.signal}),fetch('/game/track-materials.json',{signal:controller.signal})]);
    if(!assetsResponse.ok||!materialsResponse.ok)throw Error('The prepared game assets could not be loaded.');
    const assets=await assetsResponse.json() as Assets,trackMaterials=await materialsResponse.json() as TrackMaterials,data=await loadBrowserNativeDemoData(assets);
    const track=assets.tracks.find(entry=>entry.name==='DEFAULT');if(!track)throw Error('DEFAULT.TRK is required for the cloud review.');
    const configuration=Array(24).fill(0);configuration.splice(0,4,...'COUN'.split('').map(letter=>letter.charCodeAt(0)));configuration[5]=1;configuration[7]=255;configuration.splice(13,7,...'DEFAULT'.split('').map(letter=>letter.charCodeAt(0)));
    const runtime=await createNativeManualRaceRuntime(data,{configuration,track:track.raw,name:'DEFAULT',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
    if(controller.signal.aborted)return;
    const memory=runtime.session.state.memory,d=0x2d1a0,view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
    const descriptors=Array.from({length:3},(_,index)=>view.getUint16(d+0x632+index*2,true));
    setMaterials({...trackMaterials,...readOriginalMaterialPatterns(memory)});setClouds(descriptors.map(descriptor=>readUpgradedShape(memory,descriptor)));
   }catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason));}
  })();
  return()=>controller.abort();
 },[]);
 return <section className="cloud-review" aria-labelledby="cloud-review-title">
  <div className="cloud-review-heading"><div><p>3D CLOUD STUDY</p><h2 id="cloud-review-title">Cloud graphics comparison</h2></div><strong>Active in updated graphics</strong></div>
  <div className="cloud-review-types" style={{flexWrap:'wrap'}} aria-label="Choose cloud type">{[0,1,2].map(index=><button key={index} type="button" className={selected===index?'is-active':''} disabled={!clouds[index]} onClick={()=>setSelected(index)}>Cloud type {String.fromCharCode(65+index)}</button>)}<button type="button" aria-pressed={fullTurn} className={fullTurn?'is-active':''} onClick={()=>setFullTurn(!fullTurn)}>Full rotation</button></div>
  {error?<p className="cloud-review-error" role="alert">{error}</p>:clouds[selected]&&materials?<div className="cloud-review-grid">
   <figure><figcaption><strong>Previous updated graphics</strong><span>Original flat source geometry</span></figcaption><div className="cloud-review-stage"><CloudCanvas shape={clouds[selected]!} materials={materials} kind="current" type={(['A','B','C'] as const)[selected]!} fullTurn={fullTurn}/></div></figure>
   <figure><figcaption><strong>Active updated graphics</strong><span>Reference-shaped · faceted 3D cloud</span></figcaption><div className="cloud-review-stage"><CloudCanvas shape={clouds[selected]!} materials={materials} kind="candidate" type={(['A','B','C'] as const)[selected]!} fullTurn={fullTurn}/></div></figure>
  </div>:<p className="cloud-review-loading">Preparing the three original cloud types…</p>}
  <p className="cloud-review-note">Each active model follows its uploaded A, B or C reference and retains the original cloud type’s overall proportions, with broad polygon faces and a shaded underside. Use Full rotation to inspect its complete 3D shape.</p>
 </section>;
}
