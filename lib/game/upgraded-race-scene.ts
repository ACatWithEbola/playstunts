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
import {createStartTruckModel} from './start-truck-model';
import {trackRenderPlacement} from './track-render-placement';
import {elevatedRoadUnderlays} from './elevated-road-underlays';
import {hillRenderSelection} from './hill-render-selection';
import {originalCarVisible} from './car-visibility';
import {upgradedCameraBasis} from './upgraded-camera-basis';
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
 const renderer=new THREE.WebGLRenderer({antialias:false,alpha:true,logarithmicDepthBuffer:true});
 renderer.toneMapping=THREE.NoToneMapping;
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 scene.background=null;
 const camera=new THREE.PerspectiveCamera(58,1,1,200000);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30720,30720),new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,depthWrite:false}));
 // The base fill must never occlude terrain whose depth is biased behind roads.
 ground.renderOrder=-1;
 ground.rotation.x=-Math.PI/2;ground.position.set(15360,-1,15360);world.add(ground);
      const sourceMaterials={...trackMaterials,...readOriginalMaterialPatterns(runtime.session.state.memory)};
      const trackModel=createTrackModelFactory(sourceMaterials);
      const visibilityPlacements:{model:THREE.Group;key:string;detail?:number;tile?:number;terrain?:number;underlay?:boolean;origin:number[];paint:number;visible:boolean[]}[]=[];

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
            const terrainModel=trackModel(assets.shapes[group][name],0,true);
            terrainModel.position.set(x*1024+512,terrain===6?450:0,z*1024+512);
            terrainModel.rotation.y=terrainDescriptor.rotation*Math.PI/512;
            visibilityPlacements.push({model:terrainModel,key:upgradedSubmissionKey(descriptorWord(0x2bda+selected.terrain*14+4),terrainModel.position.toArray(),terrainDescriptor.rotation,0),terrain:selected.terrain,origin:terrainModel.position.toArray(),paint:0,visible:Array(assets.shapes[group][name].primitives.length).fill(false)});
            world.add(terrainModel);
          }
          if (!sourceId || sourceId >= 253) continue;
          const id=selected.tile;
          if(!id)continue;
          const descriptor=trackRenderModels[id];
          if(!descriptor)continue;
          const origin=trackRenderPlacement(descriptor,x,z,terrain===6?450:0,0).position;
          if(terrain===6)for(const underlay of elevatedRoadUnderlays(origin,descriptor.multiTile)){
            const grass=trackModel(assets.shapes.GAME2.high,0,true);
            grass.position.set(...underlay.position);world.add(grass);
            visibilityPlacements.push({model:grass,key:upgradedSubmissionKey(0x7820,underlay.position,0,0),terrain:6,underlay:true,origin:[...underlay.position],paint:0,visible:Array(assets.shapes.GAME2.high.primitives.length).fill(false)});
          }
          for(const part of [descriptor,...(descriptor.overlay?[trackRenderModels[descriptor.overlay]]:[])]){
            if(!part)throw Error('Original track overlay is missing');
            for(const detail of [0,1]){
             const shapeName=detail?part.detailShape:part.shape;if(!shapeName)continue;
             const [group,name]=shapeName.split('.');
             const paints=part.paint===255?[0,1,2,3]:[part.paint];
             for(const paint of paints){
              const road=trackModel(assets.shapes[group][name],paint);
              road.position.set(...origin);road.rotation.y=trackRenderPlacement(part,x,z,0,0).rotation;
              visibilityPlacements.push({model:road,key:upgradedSubmissionKey(descriptorWord(0x2018+part.id*14+(detail?6:4)),origin,part.rotation,paint),detail,tile:part.id,origin:[...origin],paint,visible:Array(assets.shapes[group][name].primitives.length).fill(false)});
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
   const [group,name]=shapeName.split('.'),model=trackModel(assets.shapes[group][name],0);
   model.position.set(origin[0],0,origin[2]);model.rotation.y=rotation*Math.PI/512;world.add(model);
   visibilityPlacements.push({model,key:'boundary/'+column+'/'+row+'/'+detail,tile,detail,origin,paint:0,visible:[]});
  }
 }
 const d=0x2d1a0,m=runtime.session.state.memory;
 const cars=[0x8fc2,0x8fc9].map((at,i)=>{
  const id=String.fromCharCode(...m.subarray(d+at,d+at+4));
  return [1,2].map(detail=>{const shape=assets.shapes['ST'+id]?.['car'+detail];if(!shape)return undefined;
   const model=createCarModel(shape,0xffffff,{...sourceMaterials,paint:m[d+(i?0x8fcd:0x8fc6)]});model.scale.setScalar(400);world.add(model);return model;
  });
 });
 const motion=createLiveGraphicsMotion();let fpsAt=performance.now(),fpsFrames=0;
 const clouds=new Map<string,THREE.Group>();
 const truck=createStartTruckModel(resources,assets.shapes.GAME2.truk,sourceMaterials);world.add(truck.group);
 const backdrop=createNativeBackground(runtime.session.state.memory),sky=document.createElement('canvas');sky.width=320;sky.height=200;const skyContext=sky.getContext('2d')!,skyImage=skyContext.createImageData(320,200);
 const orderedRaster=createOriginalCanvasRaster(resources,trackMaterials.palette,(width,height)=>{const surface=document.createElement('canvas');surface.width=width;surface.height=height;return surface;});
 const overlay=document.createElement('canvas');overlay.width=320;overlay.height=200;
 const overlayContext=overlay.getContext('2d')!,image=overlayContext.createImageData(320,200);
 return {
  draw(canvas:HTMLCanvasElement){
   if(renderer.getContext().isContextLost())throw Error('Graphics context lost');
   const frame=runtime.graphicsFrame();if(!frame)return false;
   const live=frame.memory,v=new DataView(live.buffer,live.byteOffset,live.byteLength);
   const groundIndex=(v.getUint16(d+0x909e,true)&255)*3;ground.material.color.setRGB(trackMaterials.palette[groundIndex]/255,trackMaterials.palette[groundIndex+1]/255,trackMaterials.palette[groundIndex+2]/255,THREE.SRGBColorSpace);
   // State 3 means a finished race, not a collision. Actual crash scenes
   // use the source's complete ordered primitives, including debris.
   const orderedScene=!!([runtime.session.state.player.driving.car.grip.crash,runtime.session.state.opponent.car.grip.crash].some(state=>state===1||state===2)||Array.from({length:24},(_,i)=>v.getInt16(d+0x8e44+i*2,true)).some(Boolean));
   const now=performance.now(),shown=motion.sample({camera:{position:frame.position,rotation:frame.angles},cars:[0,1].map(i=>({position:[0,1,2].map(axis=>v.getInt32(d+0x8c38+i*0xb8+axis*4,true)/64) as Vector,rotation:[0,1,2].map(axis=>v.getInt16(d+0x8c50+i*0xb8+axis*2,true)) as Vector}))},v.getUint16(d+0x8c26,true),[live[d+0xa3c2],live[d+0x12f],live[d+0xa9f0],...frame.rectangle].join('/'),!!live[d+0x9aca],now);
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
    model.position.set(...pose.position);
    model.rotation.set(-pose.rotation[1]*Math.PI/512,-pose.rotation[0]*Math.PI/512,-pose.rotation[2]*Math.PI/512,'YXZ');
    model.visible=detail===(live[d+0x134]>=2&&models[1]?1:0)&&originalCarVisible(live[d+0x12f],!!live[d+0xa9f0],state.grip.crash,!!i,!!live[d+0x8fc8]);
   }));
   truck.update(live);
   const level=live[d+0x134],animationPaint=live[d+0x8b4+((v.getUint16(d+0x8c26,true)||v.getUint16(d+0xaa78,true))&15)];
   for(const placement of visibilityPlacements){
    if(placement.tile===undefined){placement.model.visible=true;continue;}
    const descriptor=trackRenderModels[placement.tile]!;
    const detail=upgradedWorldDetail(level,!!descriptor.detailShape,(live[d+0x2024+placement.tile*14]<<24>>24)>=64);
    placement.model.visible=placement.detail===detail&&(!(descriptor.paint&128)||placement.paint===animationPaint);
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
   renderer.render(scene,camera);
   const pixels=frame.pixels;
   for(let i=0;i<64000;i++){const c=pixels[i]*3;image.data[i*4]=trackMaterials.palette[c];image.data[i*4+1]=trackMaterials.palette[c+1];image.data[i*4+2]=trackMaterials.palette[c+2];image.data[i*4+3]=frame.mask[i]*255;}
   overlayContext.putImageData(image,0,0);
   const context=canvas.getContext('2d')!;const background=backdrop.render(shown.camera.rotation,shown.camera.position[1],4/3,camera.fov,frame.projection,live[d+0x134]);for(let i=0;i<64000;i++){const c=background.pixels[i]*3;skyImage.data[i*4]=trackMaterials.palette[c];skyImage.data[i*4+1]=trackMaterials.palette[c+1];skyImage.data[i*4+2]=trackMaterials.palette[c+2];skyImage.data[i*4+3]=255;}skyContext.putImageData(skyImage,0,0);context.drawImage(sky,0,0,canvas.width,canvas.height);if(orderedScene){context.save();context.setTransform(canvas.width/320,0,0,canvas.height/200,0,0);const [left,right,top,bottom]=frame.rectangle;context.beginPath();context.rect(left,top,right-left,bottom-top);context.clip();for(const call of frame.calls)orderedRaster.draw(context,call,frame.rectangle);context.restore();}else context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);context.imageSmoothingEnabled=false;context.drawImage(overlay,0,0,canvas.width,canvas.height);
   fpsFrames++;if(now-fpsAt>=1000){canvas.dataset.upgradedFps=String(Math.round(fpsFrames*1000/(now-fpsAt)));fpsFrames=0;fpsAt=now;}
   return true;
  },
  close(){orderedRaster.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();}
 };
}
