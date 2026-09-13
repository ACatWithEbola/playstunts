import {readOriginalMaterialPatterns} from './original-material-pattern';
import {createOriginalCanvasRaster} from './original-canvas-raster';
import {createLiveGraphicsMotion} from './live-graphics-motion';
import {upgradedSubmissionKey,readUpgradedShape} from './upgraded-submission';
import {distantCloudPlacement,upgradedWorldDetail} from './upgraded-world-visibility';
import {createNativeBackground} from './native-background';
import * as THREE from 'three';
import type {Assets} from './types';
import {createTrackModelFactory} from './track-model';
import {createCarModel} from './car-model';
import {applyUpgradedCarMaterials,addUpgradedCarStudyLights} from './upgraded-car-materials';
import {createUpgradedCarWheelMotion} from './upgraded-car-wheels';
import {createStartTruckModel} from './start-truck-model';
import {createUpgradedTrackSigns} from './upgraded-track-signs';
import {trackRenderPlacement} from './track-render-placement';
import {elevatedRoadUnderlays} from './elevated-road-underlays';
import {hillRenderSelection} from './hill-render-selection';
import {originalCarVisible} from './car-visibility';
import {upgradedCameraBasis} from './upgraded-camera-basis';
import {createUpgradedRetroLighting,RETRO_SUN,type RetroSceneryCaster} from './upgraded-retro-lighting';
import {upgradedCarGroundingOffset,setUpgradedCarPresentationPose} from './upgraded-car-grounding';
import {upgradedCompositeShadowShapes,upgradedSceneryCastsShadow,upgradedSceneryUsesPatternedShadow} from './upgraded-scenery-shadows';
import {upgradedBackgroundView} from './upgraded-background-view';
import {upgradedTrackSeamShape} from './upgraded-track-seams';
import {type Vector} from '../physics/math';
import trackMaterials from '../../public/game/track-materials.json';
import trackRenderModels from '../../public/game/track-render-models.json';
import terrainObjects from '../../public/game/terrain-objects.json';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime';
type Runtime=Pick<Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,'raw'|'session'|'graphicsFrame'|'pixels'>;
/** Presentation-only extraction of NativeDrive's existing Three.js scene.
 * No animation loop, input adapter, simulation, audio or replay owner. */
export function createUpgradedRaceScene(assets:Assets,resources:Uint8Array,runtime:Runtime){
 const track=runtime.raw,descriptorView=new DataView(resources.buffer,resources.byteOffset,resources.byteLength),descriptorWord=(at:number)=>descriptorView.getUint16(0x2d1a0+at,true);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 addUpgradedCarStudyLights(scene,RETRO_SUN);
 const retroLighting=createUpgradedRetroLighting();
 scene.background=null;
 const camera=new THREE.PerspectiveCamera(58,1,1,200000);
 const sceneryWorldCenter=new THREE.Vector3(15360,0,-15360);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30720,30720),new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,depthWrite:false}));
 // The base fill must never occlude terrain whose depth is biased behind roads.
 // It supplies the ordinary flat grass between road and special terrain.
 // Preserve its exact original hue without procedural colour variation or
 // the cyan atmospheric blend used by distant roads and scenery.
 ground.renderOrder=-1;ground.userData.retroDistanceColour=false;
 ground.rotation.x=-Math.PI/2;ground.position.set(15360,-1,15360);world.add(ground);
      const sourceMaterials={...trackMaterials,...readOriginalMaterialPatterns(runtime.session.state.memory)};
      const trackModel=createTrackModelFactory(sourceMaterials);
      const visibilityPlacements:{model:THREE.Group;key:string;detail?:number;tile?:number;terrain?:number;underlay?:boolean;castsShadow?:boolean;shadow?:RetroSceneryCaster;keepInWorld?:boolean;origin:number[];paint:number;visible:boolean[]}[]=[];

      for (let z = 0; z < 30; z++)
        for (let x = 0; x < 30; x++) {
          const terrain = track[901+(29-z)*30+x];
          const sourceId = track[z * 30 + x];
          const selected=hillRenderSelection(terrain,sourceId);
          // Original CC2C..CC44 omits the standalone plateau under occupied
          // tiles; CF36..D002 submits its grass from the road's footprint.
          if(selected.terrain&&!(terrain===6&&sourceId!==0)){
            const terrainDescriptor=terrainObjects.find(t=>t.id===selected.terrain);
            if(!terrainDescriptor)throw Error(`Unknown terrain model ${terrain}`);
            const [group,name]=terrainDescriptor.shape.split('.');
            const terrainShape=upgradedTrackSeamShape(assets.shapes[group][name],terrainDescriptor.shape);
            const terrainModel=trackModel(terrainShape,0,true);
            if(terrain>=6)terrainModel.traverse(node=>{if(node instanceof THREE.Mesh)node.userData.retroDistanceColour=false;});
            terrainModel.position.set(x*1024+512,terrain===6?450:0,z*1024+512);
            terrainModel.rotation.y=terrainDescriptor.rotation*Math.PI/512;
            visibilityPlacements.push({model:terrainModel,key:upgradedSubmissionKey(descriptorWord(0x2bda+selected.terrain*14+4),terrainModel.position.toArray(),terrainDescriptor.rotation,0),terrain:selected.terrain,origin:terrainModel.position.toArray(),paint:0,visible:Array(terrainShape.primitives.length).fill(false)});
            world.add(terrainModel);
          }
          if (!sourceId || sourceId >= 253) continue;
          const id=selected.tile;
          if(!id)continue;
          const descriptor=trackRenderModels[id];
          if(!descriptor)continue;
          const origin=trackRenderPlacement(descriptor,x,z,terrain===6?450:0,0).position;
          if(terrain===6)for(const underlay of elevatedRoadUnderlays(origin,descriptor.multiTile)){
            const highShape=upgradedTrackSeamShape(assets.shapes.GAME2.high,'GAME2.high');
            const grass=trackModel(highShape,0,true);
            grass.traverse(node=>{if(node instanceof THREE.Mesh)node.userData.retroDistanceColour=false;});
            grass.position.set(...underlay.position);world.add(grass);
            visibilityPlacements.push({model:grass,key:upgradedSubmissionKey(0x7820,underlay.position,0,0),terrain:6,underlay:true,origin:[...underlay.position],paint:0,visible:Array(highShape.primitives.length).fill(false)});
          }
          for(const part of [descriptor,...(descriptor.overlay?[trackRenderModels[descriptor.overlay]]:[])]){
            if(!part)throw Error('Original track overlay is missing');
            for(const detail of [0,1]){
             const shapeName=detail?part.detailShape:part.shape;if(!shapeName)continue;
             const [group,name]=shapeName.split('.');
             const paints=part.paint===255?[0,1,2,3]:[part.paint];
             for(const paint of paints){
              const sourceShape=assets.shapes[group][name],shape=upgradedTrackSeamShape(sourceShape,shapeName),road=trackModel(shape,paint);
              const finishGantry=shapeName==='GAME1.fini'||shapeName==='GAME1.zfin';
              road.userData.originalTrackTile=[x,29-z];
              road.position.set(...origin);road.rotation.y=trackRenderPlacement(part,x,z,0,0).rotation;
              const composite=upgradedCompositeShadowShapes(shape,shapeName),patternedShadow=upgradedSceneryUsesPatternedShadow(shapeName);
              road.userData.retroPatternedShadow=patternedShadow;
              road.traverse(node=>{if(node instanceof THREE.Mesh)node.userData.retroPatternedShadow=patternedShadow;});
              const shadow=composite?{source:road,caster:trackModel(composite.caster,paint),receiver:trackModel(composite.receiver,paint),patterned:patternedShadow}:undefined;
              visibilityPlacements.push({model:road,key:upgradedSubmissionKey(descriptorWord(0x2018+part.id*14+(detail?6:4)),origin,part.rotation,paint),detail,tile:part.id,castsShadow:upgradedSceneryCastsShadow(shape,shapeName),shadow,keepInWorld:finishGantry,origin:[...origin],paint,visible:Array(shape.primitives.length).fill(false)});
              road.visible=false;world.add(road);
             }
            }
          }
        }

 // The source submits boundary fences separately from track-tile objects.
 // Retain the complete perimeter in upgraded mode, including corner models.
 for(let row=0;row<30;row++)for(let column=0;column<30;column++){
  const edge=column===0?(row===0?7:row===29?5:6):column===29?(row===0?1:row===29?3:2):row===0?0:row===29?4:-1;
  if(edge<0)continue;
  const tile=resources[0x2d1a0+0x8d4+edge],descriptor=trackRenderModels[tile];
  if(!descriptor)throw Error('Original boundary descriptor is missing');
  const rotation=descriptorWord(0x8c4+edge*2),origin=[column*1024+512,0,(29-row)*1024+512];
  for(const detail of [0,1]){
   const shapeName=detail?descriptor.detailShape:descriptor.shape;if(!shapeName)continue;
   const [group,name]=shapeName.split('.'),model=trackModel(assets.shapes[group][name],0),patternedShadow=upgradedSceneryUsesPatternedShadow(shapeName);model.userData.retroPatternedShadow=patternedShadow;model.traverse(node=>{if(node instanceof THREE.Mesh)node.userData.retroPatternedShadow=patternedShadow;});
   model.position.set(origin[0],0,origin[2]);model.rotation.y=rotation*Math.PI/512;world.add(model);
   visibilityPlacements.push({model,key:'boundary/'+column+'/'+row+'/'+detail,tile,detail,castsShadow:upgradedSceneryCastsShadow(assets.shapes[group][name],shapeName),origin,paint:0,visible:[]});
  }
 }
 const d=0x2d1a0,m=runtime.session.state.memory;
 const wheelMotion:Array<ReturnType<typeof createUpgradedCarWheelMotion>|undefined>=[];
 const carGrounding:number[]=[];
 const cars=[0x8fc2,0x8fc9].map((at,i)=>{
  const id=String.fromCharCode(...m.subarray(d+at,d+at+4));
  carGrounding[i]=upgradedCarGroundingOffset(assets.shapes['ST'+id]?.car1);
  return [1,2].map(detail=>{const shape=assets.shapes['ST'+id]?.['car'+detail];if(!shape)return undefined;
   const model=createCarModel(shape,0xffffff,{...sourceMaterials,paint:m[d+(i?0x8fcd:0x8fc6)]});
   applyUpgradedCarMaterials(model,shape);
   if(detail===1)wheelMotion[i]=createUpgradedCarWheelMotion(shape,model);
   model.scale.setScalar(400);world.add(model);return model;
  });
 });
 const motion=createLiveGraphicsMotion();let fpsAt=performance.now(),fpsFrames=0;
 const clouds=new Map<string,THREE.Group>();
 const truck=createStartTruckModel(resources,assets.shapes.GAME2.truk,sourceMaterials);world.add(truck.group);
 const signs=createUpgradedTrackSigns(runtime.session.state.memory,sourceMaterials);world.add(signs.group);
 const sceneryCasters:RetroSceneryCaster[]=[...visibilityPlacements.filter(placement=>placement.castsShadow).map(placement=>placement.shadow??placement.model),signs.group,truck.group];
 // Caster faces keep their exact source colours and geometry, but do not sample
 // the shared ground-shadow map themselves. This prevents the receiver-depth
 // tolerance from painting jagged self-shadow fragments onto contact edges.
 sceneryCasters.forEach(entry=>retroLighting.apply(entry instanceof THREE.Group?entry:entry.caster,true,false));
 // Car faces keep their outward normals and do not receive their own shadow.
 cars.forEach(models=>models.forEach(model=>{if(model)retroLighting.apply(model,false);}));
 retroLighting.apply(world);
 const backdrop=createNativeBackground(runtime.session.state.memory),sky=document.createElement('canvas'),turningSky=document.createElement('canvas');
 // A 384-square backing surface covers the diagonal of the 320x200 native
 // viewport. It lets the panorama follow a complete corkscrew roll without
 // exposing empty corners or enlarging the original pixel artwork.
 sky.width=320;sky.height=200;turningSky.width=turningSky.height=384;
 const skyContext=sky.getContext('2d')!,turningSkyContext=turningSky.getContext('2d')!,skyImage=skyContext.createImageData(320,200);
 const orderedRaster=createOriginalCanvasRaster(resources,trackMaterials.palette,(width,height)=>{const surface=document.createElement('canvas');surface.width=width;surface.height=height;return surface;});
 const overlay=document.createElement('canvas');overlay.width=320;overlay.height=200;
 const overlayContext=overlay.getContext('2d')!,image=overlayContext.createImageData(320,200);
 const littleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
 const packColour=(red:number,green:number,blue:number,alpha:number)=>littleEndian?(red|(green<<8)|(blue<<16)|(alpha<<24))>>>0:(alpha|(blue<<8)|(green<<16)|(red<<24))>>>0;
 const opaquePalette=new Uint32Array(256),transparentPalette=new Uint32Array(256),paletteCss:string[]=[];
 for(let index=0;index<256;index++){const at=index*3,red=trackMaterials.palette[at],green=trackMaterials.palette[at+1],blue=trackMaterials.palette[at+2];opaquePalette[index]=packColour(red,green,blue,255);transparentPalette[index]=packColour(red,green,blue,0);paletteCss[index]=`rgb(${red},${green},${blue})`;}
 const overlayPixels=new Uint32Array(image.data.buffer,image.data.byteOffset,64000),skyPixels=new Uint32Array(skyImage.data.buffer,skyImage.data.byteOffset,64000);
 let appliedGraphicsRevision=-1,orderedScene=false,worldVisibilityKey='',sceneryRevision=0;
 return {
  draw(canvas:HTMLCanvasElement){
   if(renderer.getContext().isContextLost())throw Error('Graphics context lost');
   const frame=runtime.graphicsFrame();if(!frame)return false;
   const live=frame.memory,v=new DataView(live.buffer,live.byteOffset,live.byteLength);
   const graphicsChanged=frame.revision!==appliedGraphicsRevision;
   if(graphicsChanged){
    const groundIndex=(v.getUint16(d+0x909e,true)&255)*3;ground.material.color.setRGB(trackMaterials.palette[groundIndex]/255,trackMaterials.palette[groundIndex+1]/255,trackMaterials.palette[groundIndex+2]/255,THREE.SRGBColorSpace);
    // State 3 means a finished race, not a collision. Actual crash scenes
    // use the source's complete ordered primitives, including debris.
    orderedScene=!!([runtime.session.state.player.driving.car.grip.crash,runtime.session.state.opponent.car.grip.crash].some(state=>state===1||state===2)||Array.from({length:24},(_,i)=>v.getInt16(d+0x8e44+i*2,true)).some(Boolean));
   }
   const now=performance.now(),shown=motion.sample({camera:{position:frame.position,rotation:frame.angles},cars:[0,1].map(i=>({position:[0,1,2].map(axis=>v.getInt32(d+0x8c38+i*0xb8+axis*4,true)/64) as Vector,rotation:[0,1,2].map(axis=>v.getInt16(d+0x8c50+i*0xb8+axis*2,true)) as Vector})),wheels:frame.wheels},v.getUint16(d+0x8c26,true),[live[d+0xa3c2],live[d+0x12f],live[d+0xa9f0],...frame.rectangle].join('/'),!!live[d+0x9aca],now);
   const {forward,up}=upgradedCameraBasis(shown.camera.rotation);
   const position=[shown.camera.position[0],shown.camera.position[1],-shown.camera.position[2]] as Vector;
   const target=[position[0]+forward[0],position[1]+forward[1],position[2]-forward[2]] as Vector;
   const displayUp=[up[0],up[1],-up[2]] as Vector;
   camera.position.set(...position);camera.up.set(...displayUp);camera.lookAt(...target);
   const [cx,cy,fx,fy]=frame.projection;
   camera.projectionMatrix.makePerspective(-cx/fx,(320-cx)/fx,cy/fy,-(200-cy)/fy,1,200000);
   camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
   camera.aspect=4/3;camera.fov=2*Math.atan(100/fy)*180/Math.PI;

   cars.forEach((models,i)=>models.forEach((model,detail)=>{if(!model)return;const state=i?runtime.session.state.opponent.car:runtime.session.state.player.driving.car,pose=shown.cars[i];
    setUpgradedCarPresentationPose(model,pose.position,pose.rotation,carGrounding[i]);
    if(graphicsChanged)model.visible=detail===(live[d+0x134]>=2&&models[1]?1:0)&&originalCarVisible(live[d+0x12f],!!live[d+0xa9f0],state.grip.crash,!!i,!!live[d+0x8fc8]);
   }));
   wheelMotion.forEach((motion,owner)=>{if(shown.wheels?.[owner])motion?.update(shown.wheels[owner]);});
   const level=live[d+0x134],animationPaint=live[d+0x8b4+((v.getUint16(d+0x8c26,true)||v.getUint16(d+0xaa78,true))&15)];
   if(graphicsChanged){
    let sceneryChanged=false;
    // The native truck rebuilds only when its source door angle changes. Apply
    // the caster shader solely to a newly created mesh, not on every browser RAF.
    const truckState=truck.update(live);if(truckState.rebuilt)retroLighting.apply(truck.group,true,false);sceneryChanged ||= truckState.changed;
    sceneryChanged ||= signs.update(live);
    const carTile=[live[d+0x8c3a],(29-live[d+0x8c42])&255];
    const nextVisibilityKey=level+'/'+animationPaint+'/'+carTile.join('/');
    if(nextVisibilityKey!==worldVisibilityKey){
     worldVisibilityKey=nextVisibilityKey;sceneryChanged=true;
     for(const placement of visibilityPlacements){
      if(placement.tile===undefined){placement.model.visible=true;continue;}
      const descriptor=trackRenderModels[placement.tile]!;
      const detail=upgradedWorldDetail(level,!!descriptor.detailShape,(live[d+0x2024+placement.tile*14]<<24>>24)>=64,placement.model.userData.originalTrackTile??[],carTile,placement.keepInWorld);
      placement.model.visible=placement.detail===detail&&(!(descriptor.paint&128)||placement.paint===animationPaint);
     }
    }
    if(sceneryChanged)sceneryRevision++;
   }
   clouds.forEach(model=>{model.visible=false;});
   if(level===0)for(let index=0;index<8;index++){
    const descriptor=v.getUint16(d+0x632+index*2,true),key=descriptor+'/'+index;
    let model=clouds.get(key);if(!model){model=trackModel(readUpgradedShape(live,descriptor),0);clouds.set(key,model);world.add(model);}
    const cloud=distantCloudPlacement(v.getInt16(d+0x622+index*2,true)+v.getInt16(d+0x73da,true),shown.camera.position);
    model.visible=true;model.position.set(...cloud.position);model.rotation.set(0,cloud.heading,0);model.scale.setScalar(cloud.scale);
   }
   // Upgraded mode retains the full world, with camera-frustum culling.
   // Depth testing retains every face instead of reproducing
   // angle-bucket flicker. Original stipple holes remain open in the shader.
   if(renderer.domElement.width!==canvas.width||renderer.domElement.height!==canvas.height)renderer.setSize(canvas.width,canvas.height,false);
   const shadowCars=cars.map((models,i)=>{
    const state=i?runtime.session.state.opponent.car:runtime.session.state.player.driving.car;
    if((i&&!live[d+0x8fc8])||state.grip.crash===1||state.grip.crash===2)return undefined;
    return models[live[d+0x134]>=2&&models[1]?1:0];
   });
   const playerModel=cars[0][live[d+0x134]>=2&&cars[0][1]?1:0];
   const sceneryCenter=playerModel?.getWorldPosition(new THREE.Vector3())??camera.position.clone();
   const viewDirection=new THREE.Vector3(target[0]-position[0],0,target[2]-position[2]);
   const distantShadowCenter=sceneryCenter.clone().addScaledVector(viewDirection.lengthSq()?viewDirection.normalize():new THREE.Vector3(0,0,-1),10*1024);
   // The camera-facing cascade spans two tiles behind and twenty-two ahead.
   // Clamp its centre to the world only as a fallback for an invalid pose;
   // ordinary play keeps it aligned with what the camera can actually see.
   if(!Number.isFinite(distantShadowCenter.x+distantShadowCenter.z))distantShadowCenter.copy(sceneryWorldCenter);
   retroLighting.drawShadows(renderer,shadowCars,scene,sceneryCasters,sceneryCenter,distantShadowCenter,sceneryRevision);
   renderer.render(scene,camera);
   if(graphicsChanged){const pixels=frame.pixels;for(let i=0;i<64000;i++)overlayPixels[i]=frame.mask[i]?opaquePalette[pixels[i]]:transparentPalette[pixels[i]];overlayContext.putImageData(image,0,0);appliedGraphicsRevision=frame.revision;}
   const context=canvas.getContext('2d')!,backgroundView=upgradedBackgroundView(shown.camera.rotation);
   const background=backdrop.render(backgroundView.angles,shown.camera.position[1],4/3,camera.fov,frame.projection,live[d+0x134]);
   for(let i=0;i<64000;i++)skyPixels[i]=opaquePalette[background.pixels[i]];
   skyContext.putImageData(skyImage,0,0);
   turningSkyContext.fillStyle=paletteCss[background.pixels[160]];turningSkyContext.fillRect(0,0,384,92);
   turningSkyContext.fillStyle=paletteCss[background.pixels[199*320+160]];turningSkyContext.fillRect(0,292,384,92);
   turningSkyContext.drawImage(sky,0,0,1,200,0,92,32,200);turningSkyContext.drawImage(sky,319,0,1,200,352,92,32,200);turningSkyContext.drawImage(sky,32,92);
   context.imageSmoothingEnabled=false;context.save();context.translate(canvas.width/2,canvas.height/2);context.scale(canvas.width/320,canvas.height/200);context.rotate(backgroundView.rotation);context.drawImage(turningSky,-192,-192);context.restore();
   if(orderedScene){context.save();context.setTransform(canvas.width/320,0,0,canvas.height/200,0,0);const [left,right,top,bottom]=frame.rectangle;context.beginPath();context.rect(left,top,right-left,bottom-top);context.clip();for(const call of frame.calls)orderedRaster.draw(context,call,frame.rectangle);context.restore();}else context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);context.drawImage(overlay,0,0,canvas.width,canvas.height);
   fpsFrames++;if(now-fpsAt>=1000){canvas.dataset.upgradedFps=String(Math.round(fpsFrames*1000/(now-fpsAt)));fpsFrames=0;fpsAt=now;}
   return true;
  },
  close(){retroLighting.dispose();orderedRaster.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();}
 };
}
