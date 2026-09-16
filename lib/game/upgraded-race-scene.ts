import {readOriginalMaterialPatterns} from './original-material-pattern';
import {createOriginalCanvasRaster} from './original-canvas-raster';
import {createLiveGraphicsMotion} from './live-graphics-motion';
import {upgradedSubmissionKey,readUpgradedShape} from './upgraded-submission';
import {distantCloudPlacement,upgradedWorldDetail} from './upgraded-world-visibility';
import {backgroundCamera,createNativeBackground} from './native-background';
import * as THREE from 'three';
import type {Assets} from './types';
import {createTrackModelFactory,markTrackSceneryCasterPrimitives,PERSPECTIVE_TRACK_LINE_WIDTH} from './track-model';
import {addUpgradedCarStudyLights,setUpgradedCarBrakeLights,setUpgradedCarGroundContactPanels} from './upgraded-car-materials';
import {createCompleteUpgradedCarModel} from './complete-upgraded-car-model';
import {createUpgradedCarWheelMotion} from './upgraded-car-wheels';
import {createStartTruckModel} from './start-truck-model';
import {createUpgradedTrackSigns} from './upgraded-track-signs';
import {trackRenderPlacement} from './track-render-placement';
import {elevatedRoadUnderlays} from './elevated-road-underlays';
import {hillRenderSelection} from './hill-render-selection';
import {originalCarVisible} from './car-visibility';
import {createUpgradedRetroLighting,RETRO_SUN,type RetroSceneryCaster} from './upgraded-retro-lighting';
import {upgradedCarGroundingOffset,setUpgradedCarPresentationPose} from './upgraded-car-grounding';
import {upgradedCompositeShadowShapes,upgradedSceneryCastsShadow,upgradedSceneryUsesPatternedShadow} from './upgraded-scenery-shadows';
import {upgradedBackgroundHeight,upgradedBackgroundView} from './upgraded-background-view';
import {createEnhancedChaseCamera,type EnhancedChaseCameraLevel} from './enhanced-chase-camera';
import {readUpgradedCarPose,upgradedSourceCamera} from './upgraded-source-camera';
import {createEnhancedCrashEffects} from './enhanced-crash-effects';
import {upgradedTrackSeamShape} from './upgraded-track-seams';
import {createEnhancedAlpineBackground,createEnhancedPanoramaBackground} from './enhanced-alpine-background';
import {createEnhancedCloudModel,type EnhancedCloudType} from './enhanced-cloud-model';
import {type Vector} from '../physics/math';
import trackMaterials from '../../public/game/track-materials.json';
import trackRenderModels from '../../public/game/track-render-models.json';
import terrainObjects from '../../public/game/terrain-objects.json';
import cameraTrackObjects from '../../public/game/track-objects.json';
import cameraCollisionPlanes from '../../public/game/collision-planes.json';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime';
import type {TrackObject} from '../physics/track';
import type {CollisionPlane} from '../physics/plane';
type Runtime=Pick<Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,'raw'|'session'|'graphicsFrame'|'pixels'>;
const ENHANCED_BACKGROUND_ROOT='/site/enhanced-backgrounds';
const alpineSections=['alpine-scen.png','alpine-sce2.png','alpine-sce3.png','alpine-sce4.png'].map(name=>`${ENHANCED_BACKGROUND_ROOT}/${name}`);
const enhancedPanoramas=[`${ENHANCED_BACKGROUND_ROOT}/desert.png`,`${ENHANCED_BACKGROUND_ROOT}/tropical.png`,undefined,`${ENHANCED_BACKGROUND_ROOT}/city.png`,`${ENHANCED_BACKGROUND_ROOT}/country.png`] as const;
/** Presentation-only extraction of NativeDrive's existing Three.js scene.
 * No animation loop, input adapter, simulation, audio or replay owner. */
export function createUpgradedRaceScene(assets:Assets,resources:Uint8Array,runtime:Runtime,chaseCameraLevel:()=>EnhancedChaseCameraLevel=()=>0,selectOriginalCamera:()=>void=()=>{}){
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
      // Authored cables and other line primitives have a physical diameter so
      // their projected width recedes with the rest of the 3D scenery.
      const trackModel=createTrackModelFactory(sourceMaterials,PERSPECTIVE_TRACK_LINE_WIDTH);
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
              if(composite)markTrackSceneryCasterPrimitives(road,shape,composite.caster);
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
 const carIds=[0x8fc2,0x8fc9].map(at=>String.fromCharCode(...m.subarray(d+at,d+at+4)));
 const carPaints=[m[d+0x8fc6],m[d+0x8fcd]];
 const cars=carIds.map((id,i)=>{
  const shapes=assets.shapes['ST'+id],raceShape=shapes?.car1,shape=shapes?.car0??raceShape;
  carGrounding[i]=upgradedCarGroundingOffset(raceShape);
  if(!shape)return [undefined];
  // car0 is the full-detail showroom model. Its source coordinates are 20x
  // the racing LOD, so normalize it to the same world footprint while keeping
  // its complete body, wing, lamp and wheel geometry in every enhanced view.
  // Material 45 is a live car-palette placeholder. The original race starts
  // it at material 46 and switches it to 47 independently for each braking car.
  const originalPaint={...sourceMaterials,paint:m[d+(i?0x8fcd:0x8fc6)],paletteMaterial:46};
  const {model,sourceScale}=createCompleteUpgradedCarModel(shape,raceShape,0xffffff,originalPaint);
  wheelMotion[i]=createUpgradedCarWheelMotion(shape,model,sourceScale);
  model.scale.setScalar(400/sourceScale);world.add(model);return [model];
 });
 const motion=createLiveGraphicsMotion(),chaseCamera=createEnhancedChaseCamera({raw:track,objects:cameraTrackObjects as TrackObject[],planes:cameraCollisionPlanes as CollisionPlane[]});let fpsAt=performance.now(),fpsFrames=0;
 const crashEffects=createEnhancedCrashEffects({assets,memory:m,materials:sourceMaterials,carIds,paints:carPaints,world,scene});
 const clouds=new Map<string,THREE.Object3D>();
 const cloudTypesByDescriptor=new Map<number,EnhancedCloudType>();
 const cloudTypes=['A','B','C'] as const;
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
 const backdrop=createNativeBackground(runtime.session.state.memory),panorama=track[900]&7;
 const enhancedPanorama=enhancedPanoramas[panorama];
 const enhancedBackground=panorama===2?createEnhancedAlpineBackground(alpineSections):enhancedPanorama?createEnhancedPanoramaBackground(enhancedPanorama,136):undefined;
 const sky=document.createElement('canvas'),turningSky=document.createElement('canvas');
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
 const transporterBounds=new THREE.Box3();
 let appliedGraphicsRevision=-1,appliedOverlaySourceCamera='',appliedReplayPanelSignature=-1,orderedScene=false,worldVisibilityKey='',sceneryRevision=0,lastChaseLevel:EnhancedChaseCameraLevel=0,truckChanged=false,transporterBoundsKnown=false,lastSourceCamera='';
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
    const truckState=truck.update(live);if(truckState.rebuilt)retroLighting.apply(truck.group,true,false);truckChanged=truckState.changed;
   }
   // Camera selection is input state, so the live game memory is authoritative.
   // The captured graphics memory can trail it by one paused replay redraw,
   // which made the enhanced scene change view before its replay icon did.
   const cameraState=runtime.session.state.memory,cameraMode=cameraState[d+0x12f],cameraTarget=cameraState[d+0xa9f0],sourceFrame=v.getUint16(d+0x8c26,true);
   const sourceCamera=cameraMode+'/'+cameraTarget;
   let requestedChaseLevel=chaseCameraLevel();
   if(lastSourceCamera&&requestedChaseLevel&&sourceCamera!==lastSourceCamera){selectOriginalCamera();requestedChaseLevel=0;}
   lastSourceCamera=sourceCamera;
   // An overridden native TV camera can still change sites in the background.
   // Its invisible cut must not snap the V camera's car body or steering.
   const now=performance.now(),shown=motion.sample({camera:{position:frame.position,rotation:frame.angles},cars:[0,1].map(i=>readUpgradedCarPose(v,d+0x8c38+i*0xb8)),wheels:frame.wheels,steering:[0,1].map(i=>v.getInt16(d+0x8c58+i*0xb8,true))},sourceFrame,[live[d+0xa3c2],cameraMode,cameraTarget,...frame.rectangle].join('/'),!!live[d+0x9aca],now,cameraMode===3,!!requestedChaseLevel);
   const chaseCar=cameraTarget&&live[d+0x8fc8]?1:0;
   const chasedCarPosition=new THREE.Vector3(shown.cars[chaseCar].position[0],shown.cars[chaseCar].position[1],-shown.cars[chaseCar].position[2]);
   if(truck.group.visible){truck.group.updateWorldMatrix(true,true);transporterBounds.setFromObject(truck.group).expandByScalar(12);transporterBoundsKnown=true;}
   const chaseLevel=requestedChaseLevel as EnhancedChaseCameraLevel;
   const chase=chaseLevel?chaseCamera.sample(shown.cars[chaseCar],chaseLevel,chaseCar,now,sourceFrame,live[d+0xa3c2],shown.steering?.[chaseCar]??0):undefined;
   let transporterCutaway=false;
   if(chase&&transporterBoundsKnown){
    const carInsideTransporter=transporterBounds.containsPoint(chasedCarPosition);
    // Close and Standard retain their real chase distances at the opening of a
    // drive or replay. The truck is omitted only from this camera render so its
    // closed doors cannot occlude the car; simulation, geometry and door motion
    // remain untouched. Frame zero covers the entire automatic rollout, even
    // after the car's centre has crossed the truck bounds; keeping the cutaway
    // until the timed race begins prevents the chase eye from looking back
    // through a door or wall during that handoff. Far keeps the exterior view.
    transporterCutaway=chaseLevel<=2&&truck.group.visible&&(sourceFrame===0||carInsideTransporter);
   }
   const chaseChanged=chaseLevel!==lastChaseLevel;
   if(!chase)chaseCamera.reset();
   const sourceView=upgradedSourceCamera(shown.camera),position=chase?.position??sourceView.position,target=chase?.target??sourceView.target,displayUp=chase?.up??sourceView.up;
   camera.position.set(...position);camera.up.set(...displayUp);camera.lookAt(...target);
   const [cx,cy,fx,fy]=frame.projection;
   const chaseFy=chase?100/Math.tan(chase.fov*Math.PI/360):fy,chaseFx=chase?chaseFy*1.2:fx;
   camera.projectionMatrix.makePerspective(-cx/chaseFx,(320-cx)/chaseFx,cy/chaseFy,-(200-cy)/chaseFy,1,200000);
   camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
   camera.aspect=4/3;camera.fov=chase?.fov??2*Math.atan(100/fy)*180/Math.PI;
   canvas.dataset.enhancedCamera=chase?`chase-${chaseLevel}`:requestedChaseLevel?'chase-pending':'original';

   cars.forEach((models,i)=>models.forEach((model,detail)=>{if(!model)return;const state=i?runtime.session.state.opponent.car:runtime.session.state.player.driving.car,pose=shown.cars[i];
    setUpgradedCarPresentationPose(model,pose.position,pose.rotation,carGrounding[i]);
    setUpgradedCarBrakeLights(model,!!live[d+0x8c38+i*0xb8+0xa4],sourceMaterials);
    const carState=d+0x8c38+i*0xb8;
    setUpgradedCarGroundContactPanels(model,!!live[carState+0xa9]&&!live[carState+0xb1]);
    if(graphicsChanged||chaseChanged)model.visible=detail===(live[d+0x134]>=2&&models[1]?1:0)&&originalCarVisible(chase?2:cameraMode,!!cameraTarget,state.grip.crash,!!i,!!live[d+0x8fc8]);
   }));
   wheelMotion.forEach((motion,owner)=>motion?.update(shown.wheels?.[owner],shown.steering?.[owner]));
   crashEffects.update(live,shown.cars,sourceFrame,now,!!chase);
   const level=live[d+0x134],animationPaint=live[d+0x8b4+((v.getUint16(d+0x8c26,true)||v.getUint16(d+0xaa78,true))&15)];
   if(graphicsChanged){
    let sceneryChanged=false;
    // The native truck rebuilds only when its source door angle changes. Its
    // update occurs before camera placement so an activated chase view can
    // remain on the original camera until the followed car clears the truck.
    sceneryChanged ||= truckChanged;truckChanged=false;
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
    // The first three source records establish the game's three cloud types;
    // later sky positions reuse those descriptors. If a variant is supplied
    // outside that table, the model factory falls back to its source outline.
    if(index<cloudTypes.length&&!cloudTypesByDescriptor.has(descriptor))cloudTypesByDescriptor.set(descriptor,cloudTypes[index]!);
    let model=clouds.get(key);if(!model){model=createEnhancedCloudModel(readUpgradedShape(live,descriptor),cloudTypesByDescriptor.get(descriptor));clouds.set(key,model);world.add(model);}
    const cloudCamera=chase?[position[0],position[1],-position[2]] as Vector:shown.camera.position;
    const cloud=distantCloudPlacement(v.getInt16(d+0x622+index*2,true)+v.getInt16(d+0x73da,true),cloudCamera,cloudCamera[1]);
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
   // This is a view-only cutaway. Restore visibility immediately after the
   // colour pass so every other camera and the next native frame sees the same
   // transporter produced by the original game state.
   if(transporterCutaway)truck.setCutaway(true);
   try{renderer.render(scene,camera);}finally{if(transporterCutaway)truck.setCutaway(false);}
   const overlaySource=runtime.session.replaying?runtime.pixels:frame.pixels;
   let replayPanelSignature=-1;
   if(runtime.session.replaying){
    // The native replay loop can redraw its control strip after the world and
    // camera state have already changed. Hash that small strip so enhanced
    // presentation notices the finished icon/selection redraw without doing a
    // full 320x200 overlay rebuild on every browser animation frame.
    replayPanelSignature=2166136261;
    for(let i=144*320;i<64000;i++)replayPanelSignature=Math.imul((replayPanelSignature^overlaySource[i])>>>0,16777619)>>>0;
   }
   if(graphicsChanged||runtime.session.replaying&&(sourceCamera!==appliedOverlaySourceCamera||replayPanelSignature!==appliedReplayPanelSignature)){
    // Replay controls are redrawn directly into the live native framebuffer.
    // The separately captured world frame can still contain the previous
    // camera icon after C/F1-F4 changes view while playback is paused, even
    // though the upgraded camera has already switched. Source the overlay from
    // the framebuffer the player actually sees so its icon and selection state
    // always describe the rendered camera.
    for(let i=0;i<64000;i++)overlayPixels[i]=frame.mask[i]?opaquePalette[overlaySource[i]]:transparentPalette[overlaySource[i]];
    overlayContext.putImageData(image,0,0);appliedGraphicsRevision=frame.revision;appliedOverlaySourceCamera=sourceCamera;appliedReplayPanelSignature=replayPanelSignature;
   }
   const context=canvas.getContext('2d')!,backgroundAngles=chase?backgroundCamera(position,target,displayUp,true).angles:[...shown.camera.rotation] as Vector;
   const backgroundView=upgradedBackgroundView(backgroundAngles);
   const effectiveBackgroundHeight=upgradedBackgroundHeight(!!chase,cameraMode,position[1]);
   const background=backdrop.render(backgroundView.angles,effectiveBackgroundHeight,4/3,camera.fov,chase?[cx,cy,chaseFx,chaseFy]:frame.projection,live[d+0x134],chase?undefined:frame.rectangle);
   // The cylindrical enhanced artwork is level-projected and then rolled with
   // the source camera, so a bank no longer switches back to pixel artwork.
   const enhancedBackgroundDrawn=background.panoramaHorizon!==undefined&&(enhancedBackground?.draw(context,{width:canvas.width,height:canvas.height,heading:backgroundView.angles[2],horizon:background.panoramaHorizon,rotation:backgroundView.rotation,sky:paletteCss[background.sky],ground:paletteCss[background.ground]})??false);
   if(!enhancedBackgroundDrawn){
    for(let i=0;i<64000;i++)skyPixels[i]=opaquePalette[background.pixels[i]];
    skyContext.putImageData(skyImage,0,0);
    turningSkyContext.fillStyle=paletteCss[background.sky];turningSkyContext.fillRect(0,0,384,92);
    turningSkyContext.fillStyle=paletteCss[background.ground];turningSkyContext.fillRect(0,292,384,92);
    turningSkyContext.drawImage(sky,0,0,1,200,0,92,32,200);turningSkyContext.drawImage(sky,319,0,1,200,352,92,32,200);turningSkyContext.drawImage(sky,32,92);
    context.imageSmoothingEnabled=false;context.save();context.translate(canvas.width/2,canvas.height/2);context.scale(canvas.width/320,canvas.height/200);context.rotate(backgroundView.rotation);context.drawImage(turningSky,-192,-192);context.restore();
   }
   // The original ordered crash raster is still the faithful fallback for the
   // original cameras. A selected enhanced chase camera must keep rendering
   // its own viewpoint through a crash instead of snapping to the cockpit.
   if(orderedScene&&!chase){context.save();context.setTransform(canvas.width/320,0,0,canvas.height/200,0,0);const [left,right,top,bottom]=frame.rectangle;context.beginPath();context.rect(left,top,right-left,bottom-top);context.clip();for(const call of frame.calls)orderedRaster.draw(context,call,frame.rectangle);context.restore();}else context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);
   context.imageSmoothingEnabled=false;
   if(!chase)context.drawImage(overlay,0,0,canvas.width,canvas.height);
   else if(runtime.session.replaying){
    // Replay controls live outside the original 3D viewport and must remain
    // usable in chase mode. During normal driving no cockpit overlay is drawn,
    // giving the external camera the full window and restoring it automatically
    // when V, C, F1-F4 or the camera control returns to a Stunts view.
    const [left,right,top,bottom]=frame.rectangle,sx=canvas.width/320,sy=canvas.height/200;
    const drawOverlayRegion=(x:number,y:number,width:number,height:number)=>{if(width>0&&height>0)context.drawImage(overlay,x,y,width,height,x*sx,y*sy,width*sx,height*sy);};
    drawOverlayRegion(0,0,320,top);drawOverlayRegion(0,bottom,320,200-bottom);
    drawOverlayRegion(0,top,left,bottom-top);drawOverlayRegion(right,top,320-right,bottom-top);
   }
   lastChaseLevel=chaseLevel;fpsFrames++;if(now-fpsAt>=1000){canvas.dataset.upgradedFps=String(Math.round(fpsFrames*1000/(now-fpsAt)));fpsFrames=0;fpsAt=now;}
   return true;
  },
  close(){enhancedBackground?.close();crashEffects.close();retroLighting.dispose();orderedRaster.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();}
 };
}
