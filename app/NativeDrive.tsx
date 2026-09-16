'use client';
import {createRolloutCameraPhase} from '@/lib/game/rollout-camera-phase';
import {createHighResolutionTrackVisibility} from '@/lib/game/high-resolution-track-visibility';
import {createTrackPrimitiveVisibility} from '@/lib/game/track-primitive-visibility';
import {initializeSameCarRenderBank} from '@/lib/game/initialize-same-car-render-bank';
import {createNativeOrderedPresentation} from '@/lib/game/native-ordered-presentation';
import {createNativeBackground,backgroundCamera} from '@/lib/game/native-background';
import {createNativeOriginalRenderer} from '@/lib/game/native-original-renderer';
import {analyzeRoute} from '@/lib/physics/route-analysis';
import {createCockpitGaugeMemory} from '@/lib/game/cockpit-gauge-memory';
import {createNativeRaceSession,type NativeRaceData} from '@/lib/game/native-race-session';
import {elevatedRoadUnderlays} from '@/lib/game/elevated-road-underlays';
import {trackRenderPlacement} from '@/lib/game/track-render-placement';
import trackRenderModels from '@/public/game/track-render-models.json';
import {clearChaseTransporter} from '@/lib/game/chase-transporter-clearance';
import {createStartTruckModel} from '@/lib/game/start-truck-model';
import {createTrackModelFactory} from '@/lib/game/track-model';
import trackMaterials from '@/public/game/track-materials.json';
import {originalCarVisible} from '@/lib/game/car-visibility';
import {dividedEntryCircuit} from '@/lib/game/divided-entry-circuit';
import {largeCurveCircuit} from '@/lib/game/large-curve-circuit';
import CockpitInstruments from './CockpitInstruments';
import CockpitCrash from './CockpitCrash';
import CockpitArtwork from './CockpitArtwork';
import {cockpitWheel} from '@/lib/game/cockpit-wheel';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { type DrivingView } from '@/lib/game/driving-camera';
import {nativeDrivingCamera,interpolateNativeCamera} from '@/lib/game/native-driving-camera';
import type { Assets } from '@/lib/game/types';
import { createCarModel } from '@/lib/game/car-model';
import { interpolatePose, type RenderPose } from '@/lib/game/render-pose';
import { createNativeAudio, type NativeAudio } from '@/lib/game/native-audio';
import {verticalCorkscrewCircuit} from '@/lib/game/vertical-corkscrew-circuit';
import {barrierCircuit} from '@/lib/game/barrier-circuit';
import terrainObjects from '@/public/game/terrain-objects.json';
import {hillCircuit} from '@/lib/game/hill-circuit';
import {hillRenderSelection} from '@/lib/game/hill-render-selection';
import {sceneryCircuit} from '@/lib/game/scenery-circuit';
import {pipeCircuit} from '@/lib/game/pipe-circuit';
import {tunnelCircuit} from '@/lib/game/tunnel-circuit';
import {loopCircuit} from '@/lib/game/loop-circuit';
import {curveCircuit} from '@/lib/game/curve-circuit';
import {bankCircuit} from '@/lib/game/bank-circuit';
import { rampCircuit } from '@/lib/game/ramp-circuit';
import { stepDriving, type DrivingState } from '@/lib/game/driving-step';
import { placePlayerParticle } from '@/lib/game/particle-placement';
import { createDebrisModel } from '@/lib/game/debris-model';
import { rotateZXY } from '@/lib/physics/rotation';
import type { CollisionPlane } from '@/lib/physics/plane';
import type { CollisionWall } from '@/lib/physics/wall';
import { testCircuit } from '@/lib/game/test-circuit';
import { stepLevel, type LevelState } from '@/lib/physics/level-step';
import { levelTrackContact, type TrackObject } from '@/lib/physics/track';
import type { EngineTuning } from '@/lib/physics/engine';
import type { GripTuning } from '@/lib/physics/grip';
import type { Vector } from '@/lib/physics/math';

export default function NativeDrive({
  assets,
  onBack,
}: {
  assets: Assets;
  onBack: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    actions = useRef<{
      reset: () => void;
      pause: () => void;
      sound: () => void;
      replay: () => void;
      seek: (frame:number) => void;
    } | null>(null);
  const [hud, setHud] = useState({
    speed: 0,
    rpm: 800,
    gear: 1,
    paused: false,
  });
  const [replayView,setReplayView]=useState({active:false,frame:0,length:0});
  const [wheelFrame,setWheelFrame]=useState(1);
  const [crashView,setCrashView]=useState({crash:0,elapsed:0});
  const [gaugeMemory]=useState(createCockpitGaugeMemory);
  const [instrumentReadings,setInstrumentReadings]=useState(()=>({speed:0,rpm:0,knobX:22,knobY:42,steeringScaled:0,...gaugeMemory.capture()}));
  const [drivingView, setDrivingView] = useState<DrivingView>('cockpit');
  const drivingViewRef = useRef<DrivingView>('cockpit');
  function changeView(value: DrivingView) {
    drivingViewRef.current = value;
    setDrivingView(value);
  }
  const [course, setCourse] = useState<'default' | 'original' | 'flat' | 'ramps' | 'banks' | 'curves' | 'loop' | 'tunnel' | 'pipe' | 'corkscrew' | 'barriers' | 'scenery' | 'hills' | 'large-curves' | 'divided'>('default');
  const originalTrackName=course==='default'?'DEFAULT':course==='original'?'CTRACK10':null;
  const [notice, setNotice] = useState('Loading the test circuit…');
  const [soundLabel, setSoundLabel] = useState('AdLib sound: on');
  useEffect(() => {
    let disposed = false,
      cleanup = () => {};
    async function mount() {
      const [objects, seed, planes, wallData, sharedSeed] = await Promise.all([
        fetch('/game/track-objects.json').then((r) => {
          if (!r.ok) throw Error('Track files could not load');
          return r.json() as Promise<TrackObject[]>;
        }),
        fetch(
          course === 'loop' ? '/game/native-loop-seed.json' : course !== 'flat'
            ? '/game/native-ramp-seed.json'
            : '/game/native-seed.json',
        ).then((r) => {
          if (!r.ok) throw Error('Car files could not load');
          return r.json() as Promise<LevelState>;
        }),
        fetch('/game/collision-planes.json').then((r) => {
          if (!r.ok) throw Error('Collision planes could not load');
          return r.json() as Promise<CollisionPlane[]>;
        }),
        fetch('/game/collision-walls.json').then((r) => {
          if (!r.ok) throw Error('Collision walls could not load');
          return r.json() as Promise<{ walls: CollisionWall[] }>;
        }),
        fetch('/game/native-driving-seed.json').then(r=>{if(!r.ok)throw Error('Driving state could not load');return r.json() as Promise<Pick<DrivingState,'race'|'particles'> & {contactWheelAngles:number[]}>;}),
      ]);
      const el = host.current;
      if (disposed || !el) return;
      const car = assets.cars.find(
        (c) => c.id === 'COUN',
      ) as unknown as EngineTuning & GripTuning & { rawSimulation: string };
      const bytes = Uint8Array.from(car.rawSimulation.match(/../g)!, (x) =>
        parseInt(x, 16),
      );
      const view = new DataView(bytes.buffer);
      const landmarks = {dimensions:[0,1,2].map(axis=>view.getInt16(200+axis*2,true)) as Vector,radius:view.getInt16(206,true),hillHeight:450};
      const wheels = Array.from(
        { length: 4 },
        (_, i) =>
          [0, 1, 2].map((axis) =>
            view.getInt16(210 + i * 6 + axis * 2, true),
          ) as Vector,
      );
      const track = originalTrackName ? assets.tracks.find(t=>t.name===originalTrackName)!.raw : course === 'divided' ? dividedEntryCircuit() : course === 'large-curves' ? largeCurveCircuit() : course === 'hills' ? hillCircuit() : course === 'scenery' ? sceneryCircuit() : course === 'barriers' ? barrierCircuit() : course === 'corkscrew' ? verticalCorkscrewCircuit() : course === 'pipe' ? pipeCircuit() : course === 'tunnel' ? tunnelCircuit() : course === 'loop' ? loopCircuit() : course === 'curves' ? curveCircuit() : course === 'banks' ? bankCircuit() : course === 'ramps' ? rampCircuit() : testCircuit();
      // Keep the experimental source-order renderer out of the normal preview
      // until moving cars and all primitive types are verified at modern resolution.
      const useOriginalDrawOrder=!!originalTrackName&&new URLSearchParams(window.location.search).has('ordered-check');
      let raceSession:ReturnType<typeof createNativeRaceSession>|undefined;
      let backdrop:ReturnType<typeof createNativeBackground>|undefined;
      let originalRenderer:ReturnType<typeof createNativeOriginalRenderer>|undefined;
      let originalResources:Uint8Array|undefined;
      let truckModel:ReturnType<typeof createStartTruckModel>|undefined;
      if(originalTrackName){
        const files=['route-records','route-vectors','route-sample-vectors','route-point-vectors','route-speed-indices'];
        const [startup,packedOpponent,renderResources,...resources]=await Promise.all([
          fetch('/game/native-race-startup.bin').then(r=>{if(!r.ok)throw Error('Race startup could not load');return r.arrayBuffer();}),
          fetch('/game/opponents/opp1.pre').then(r=>{if(!r.ok)throw Error('Opponent could not load');return r.arrayBuffer();}),
          fetch('/game/native-render-resources.bin').then(r=>{if(!r.ok)throw Error('Original scene artwork could not load');return r.arrayBuffer();}),
          ...files.map(name=>fetch(`/game/${name}.json`).then(r=>{if(!r.ok)throw Error('Race resources could not load');return r.json();})),
        ]);
        if(disposed)return;
        const raceData={startup:new Uint8Array(startup),packedOpponent:new Uint8Array(packedOpponent),simulation:bytes,tuning:car,raw:track,objects,planes,walls:wallData.walls,records:resources[0],vectors:resources[1],samples:resources[2],points:resources[3],indices:resources[4]} as NativeRaceData;
        raceSession=createNativeRaceSession(raceData,{transporter:true});
        originalResources=new Uint8Array(renderResources);
        if(useOriginalDrawOrder)initializeSameCarRenderBank(originalResources,0x2d1a0,0xa000);
        backdrop=createNativeBackground(originalResources);
        truckModel=createStartTruckModel(new Uint8Array(renderResources),assets.shapes.GAME2.truk,trackMaterials);
        originalRenderer=createNativeOriginalRenderer(new Uint8Array(renderResources),track,analyzeRoute(track,raceData.records,raceData.vectors,raceData.samples,objects));
      }
      let state = structuredClone(seed),
        paused = false,
        accumulator = 0,
        last = performance.now(),
        hudAt = 0;
      let driving:DrivingState={car:state,race:structuredClone(sharedSeed.race),particles:structuredClone(sharedSeed.particles)},simulationFrame=0;
      let previousPose = structuredClone(state.pose);
      let previousOpponentPose=raceSession?structuredClone(raceSession.state.opponent.car.pose):undefined;
      const held = new Set<string>();
      let audio: NativeAudio | undefined,
        audioPending = false,
        soundEnabled = true;
      function enableAudio() {
        if (disposed || (!soundEnabled && !audio)) return;
        if (audio) {
          if (!paused)
            void audio
              .resume()
              .catch(() => setSoundLabel('Click to enable sound'));
          return;
        }
        if (audioPending) return;
        audioPending = true;
        const context = new AudioContext({ latencyHint: 'interactive' });
        void context.resume().catch(() => {});
        void createNativeAudio(context,raceSession?.audioMemory)
          .then((result) => {
            audioPending = false;
            if (disposed) {
              result.close();
              return;
            }
            audio = result;
            audio.setEnabled(soundEnabled);
            audio.update(state.engine.rpm);
            if(state.grip.crash===1||state.grip.crash===2)audio.crash();
            if (!paused)
              void audio
                .resume()
                .catch(() => setSoundLabel('Click to enable sound'));
          })
          .catch((error) => {
            audioPending = false;
            if (!disposed) {
              soundEnabled = false;
              setSoundLabel('Retry AdLib sound');
              setNotice(
                error instanceof Error
                  ? error.message
                  : 'Sound could not start',
              );
            }
          });
      }
      function sound() {
        soundEnabled = !soundEnabled;
        setSoundLabel(soundEnabled ? 'AdLib sound: on' : 'AdLib sound: off');
        audio?.setEnabled(soundEnabled);
        if (soundEnabled) enableAudio();
      }

      // Multisample edge coverage with fragment-written logarithmic depth let
      // original elevated-road end faces bleed through their adjoining decks.
      // Keep one depth sample per pixel; the 24-position executable comparison
      // has no brown road-interior pixels with this configuration.
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, logarithmicDepthBuffer: true });
      const orderedPresentation=useOriginalDrawOrder&&originalRenderer&&originalResources?
        createNativeOrderedPresentation(originalRenderer,originalResources,trackMaterials.palette,renderer.domElement,renderer.getContext() as WebGL2RenderingContext):undefined;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const scene = new THREE.Scene();
      const world = new THREE.Group();
      world.scale.z = -1; // Original world handedness, shared by car, roads and camera.
      scene.add(world);
      scene.background = backdrop?null:new THREE.Color(0xaacbe0);
      scene.fog = new THREE.Fog(0xaacbe0, 3500, 17000);
      const camera = new THREE.PerspectiveCamera(58, 1, 1, 30000);
      scene.add(new THREE.HemisphereLight(0xe4f5ff, 0x536735, 2.8));
      const sun = new THREE.DirectionalLight(0xfff2d6, 2.7);
      sun.position.set(4000, 8000, 2000);
      scene.add(sun);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30720, 30720),
        new THREE.MeshStandardMaterial({ color: 0x5b7846, roughness: 1 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(15360, -1, 15360);
      world.add(ground);
      const trackModel=createTrackModelFactory(trackMaterials);
      const visibilityOptions=new URLSearchParams(window.location.search);
      const continuousVisibility=!visibilityOptions.has('visibility-check');
      const visibilityMatrix=new THREE.Matrix4();
      const trackVisibility=originalResources&&!visibilityOptions.has('visibility-off')?createHighResolutionTrackVisibility(originalResources):undefined;
      const visibilityPlacements:{model:THREE.Group;tile?:number;terrain?:number;underlay?:boolean;origin:number[];paint:number;visible:boolean[];filter:ReturnType<typeof createTrackPrimitiveVisibility>}[]=[];
      const animatedTrackPaints:THREE.Group[][]=[];
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
            const terrainModel=trackModel(assets.shapes[group][name]);
            terrainModel.position.set(x*1024+512,terrain===6?450:0,z*1024+512);
            terrainModel.rotation.y=terrainDescriptor.rotation*Math.PI/512;
            if(trackVisibility)visibilityPlacements.push({model:terrainModel,terrain:selected.terrain,origin:terrainModel.position.toArray(),paint:0,visible:Array(assets.shapes[group][name].primitives.length).fill(false),filter:createTrackPrimitiveVisibility(terrainModel)});
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
            if(trackVisibility)visibilityPlacements.push({model:grass,terrain:6,underlay:true,origin:[...underlay.position],paint:0,visible:Array(assets.shapes.GAME2.high.primitives.length).fill(false),filter:createTrackPrimitiveVisibility(grass)});
          }
          for(const part of [descriptor,...(descriptor.overlay?[trackRenderModels[descriptor.overlay]]:[])]){
            if(!part)throw Error('Original track overlay is missing');
            const [group,name]=part.shape.split('.');
            const paints=part.paint===255?[0,1,2,3]:[part.paint];
            const models=paints.map(paint=>{
              const road=trackModel(assets.shapes[group][name],paint);
              road.position.set(...origin);road.rotation.y=trackRenderPlacement(part,x,z,0,0).rotation;
              if(trackVisibility)visibilityPlacements.push({model:road,tile:part.id,origin:[...origin],paint,visible:Array(assets.shapes[group][name].primitives.length).fill(false),filter:createTrackPrimitiveVisibility(road)});
              road.visible=paint===paints[0];world.add(road);return road;
            });
            if(part.paint===255)animatedTrackPaints.push(models);
          }
        }
      const model = createCarModel(assets.shapes.STCOUN.car0, 0xe7bd32);
      model.scale.setScalar(12.5);
      world.add(model);
      if(truckModel)world.add(truckModel.group);
      const opponentModel=originalTrackName?createCarModel(assets.shapes.STCOUN.car0,0xc43d32):null;
      if(opponentModel){opponentModel.scale.setScalar(12.5);world.add(opponentModel);}
      const debris=Array.from({length:24},()=>{
        const variants=Array.from({length:4},(_,i)=>createDebrisModel(assets.shapes.STCOUN[`exp${i}`]));
        variants.forEach(v=>{v.visible=false;world.add(v);});return variants;
      });
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 30),
        new THREE.MeshBasicMaterial({
          color: 0xf3f1d8,
          side: THREE.DoubleSide,
        }),
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(7.5 * 1024, 3, 7.5 * 1024);
      marker.visible=!originalTrackName;
      world.add(marker);
      let presentationFrame:ReturnType<typeof nativeDrivingCamera>|undefined;
      const rolloutCamera=createRolloutCameraPhase();
      const transporterCameraBounds = new THREE.Box3();
      let backdropCamera:ReturnType<typeof backgroundCamera>|undefined;
      function place(pose: RenderPose = state.pose) {
        if(truckModel&&raceSession)truckModel.update(raceSession.state.memory);
        const paint=trackMaterials.animation[simulationFrame&15];
        animatedTrackPaints.forEach(models=>models.forEach((model,index)=>{model.visible=index===paint;}));
        const p = new THREE.Vector3(...pose.position.map((n) => n / 64));
        model.position.copy(p);
        model.position.y -= 6;
        model.rotation.set(
          (-pose.rotation[1] * Math.PI) / 512,
          (-pose.rotation[0] * Math.PI) / 512,
          (-pose.rotation[2] * Math.PI) / 512,
          'YXZ',
        );
        if(opponentModel&&raceSession){
          const opponent=raceSession.state.opponent.car;
          const pose=paused||!previousOpponentPose?opponent.pose:interpolatePose(previousOpponentPose,opponent.pose,accumulator/0.05);
          opponentModel.position.set(...pose.position.map(n=>n/64) as Vector);opponentModel.position.y-=6;
          opponentModel.rotation.set(-pose.rotation[1]*Math.PI/512,-pose.rotation[0]*Math.PI/512,-pose.rotation[2]*Math.PI/512,'YXZ');
          opponentModel.visible=originalCarVisible(2,false,opponent.grip.crash,true);
        }
        model.visible = originalCarVisible(drivingViewRef.current === 'cockpit' ? 0 : 2,false,state.grip.crash);
        debris.forEach((variants,i)=>{
          variants.forEach(v=>v.visible=false);
          const particle=driving.particles.particles[i];
          if(course==='flat'||!particle.speed||particle.owner!==0)return;
          const placement=placePlayerParticle(particle,state.pose.position,[0,0,0]);
          const node=variants[particle.style-4];node.visible=true;
          const m=rotateZXY(...placement.rotation);
          node.matrixAutoUpdate=false;
          node.matrix.set(m[0]/16384,m[3]/16384,m[6]/16384,placement.position[0],m[1]/16384,m[4]/16384,m[7]/16384,placement.position[1],m[2]/16384,m[5]/16384,m[8]/16384,placement.position[2],0,0,0,1);
        });
        if(raceSession?.introducing)rolloutCamera.begin(pose.position);
        if(!raceSession?.replaying)rolloutCamera.update(pose.position);
        const rolloutProgress=raceSession&&!raceSession.replaying?rolloutCamera.at(pose.position):undefined;
        const cameraTrack={raw:track,objects,planes,mode:raceSession?.state.memory[0x2d1a0+0xa3c2]??0};
        const cameraAt=(p:RenderPose)=>nativeDrivingCamera(p,drivingViewRef.current,view.getInt16(208,true),cameraTrack,
          raceSession&&!raceSession.replaying?rolloutCamera.at(p.position):undefined,!!orderedPresentation);
        const frame = drivingViewRef.current==='chase'&&!orderedPresentation?
          nativeDrivingCamera(pose,'chase',view.getInt16(208,true),cameraTrack,rolloutProgress,false,true):
          drivingViewRef.current==='chase'?
          interpolateNativeCamera(cameraAt(previousPose),cameraAt(state.pose),paused?1:accumulator/0.05):
          nativeDrivingCamera(pose,'cockpit',view.getInt16(208,true),cameraTrack,rolloutProgress,!!orderedPresentation);
        // The optional chase eye can end up inside the parked transporter.
        // Use the actual recovered mesh bounds; leave cockpit/source state alone.
        if(drivingViewRef.current==='chase'&&truckModel?.group.visible){
          truckModel.group.updateWorldMatrix(true,true);
          transporterCameraBounds.setFromObject(truckModel.group);
          frame.position=clearChaseTransporter(frame.position,frame.target,transporterCameraBounds,camera.near);
        }
        presentationFrame=frame;
        camera.position.set(...frame.position);
        camera.up.set(...frame.up);
        camera.lookAt(...frame.target);
        if(backdrop)backdropCamera=backgroundCamera(frame.position,frame.target,frame.up);
      }
      function reset() {
        rolloutCamera.reset();
        setCrashView({crash:0,elapsed:0});setReplayView({active:false,frame:0,length:0});
        state = structuredClone(seed);
        state.contactWheelAngles=[...sharedSeed.contactWheelAngles];
        driving={car:state,race:structuredClone(sharedSeed.race),particles:structuredClone(sharedSeed.particles)};simulationFrame=0;
        if (course === 'flat')
          state.pose.position = [7.5 * 65536, 512, 7.5 * 65536];
        state.pose.rotation = [...seed.pose.rotation];
        state.grip.yaw = seed.grip.yaw;
        state.grip.roll = seed.grip.roll;
        if(raceSession){const race=raceSession.reset();driving=race.player.driving;state=driving.car;}
        previousPose = structuredClone(state.pose);
        previousOpponentPose=raceSession?structuredClone(raceSession.state.opponent.car.pose):undefined;
        held.clear();
        setWheelFrame(cockpitWheel(state.grip.steeringAngle).frame);
          setInstrumentReadings({...gaugeMemory.capture(raceSession?.state.memory),speed:state.engine.speed,rpm:state.engine.rpm,knobX:state.engine.knobX,knobY:state.engine.knobY,steeringScaled:cockpitWheel(state.grip.steeringAngle).scaled});
        paused = false;
        accumulator = 0;
        audio?.reset(state.engine.rpm);
        setHud({
          speed: 0,
          rpm: state.engine.rpm,
          gear: state.engine.gear,
          paused: false,
        });
        place();
        setNotice(originalTrackName?`${originalTrackName} · Opponent in the other Countach. Arrow keys to drive; V changes view.`:'Click the circuit, then use the arrow keys to drive.');
        el?.focus();
      }
      function pause() {
        paused = !paused;
        held.clear();
        accumulator = 0;
        previousPose = state.pose;
        setHud((h) => ({ ...h, paused }));
        if (paused) audio?.pause();
        else {
          enableAudio();
          el?.focus();
        }
      }
      function seek(frame:number,play=false){
        if(!raceSession||raceSession.introducing)return;
        const race=raceSession.seek(frame);driving=race.player.driving;state=driving.car;simulationFrame=driving.race.stats[2];
        previousPose=structuredClone(state.pose);previousOpponentPose=structuredClone(race.opponent.car.pose);
        paused=!play;held.clear();accumulator=0;audio?.pause();audio?.reset(state.engine.rpm);
        setWheelFrame(cockpitWheel(state.grip.steeringAngle).frame);
        setInstrumentReadings({...gaugeMemory.capture(raceSession?.state.memory),speed:state.engine.speed,rpm:state.engine.rpm,knobX:state.engine.knobX,knobY:state.engine.knobY,steeringScaled:cockpitWheel(state.grip.steeringAngle).scaled});
        setCrashView({crash:state.grip.crash,elapsed:(simulationFrame-driving.race.stats[5])&65535});
        setReplayView({active:true,frame:simulationFrame,length:raceSession.length});
        setHud({speed:Math.round(state.engine.roadSpeed/256),rpm:state.engine.rpm,gear:state.engine.gear,paused});
        setNotice('Replay · use the timeline to seek. Reset starts a new race.');place();
        if(play){enableAudio();el?.focus();}
      }
      actions.current = {
        reset: () => {
          reset();
          enableAudio();
        },
        pause,
        sound,
        replay:()=>seek(0,true),
        seek,
      };
      const down = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (
          [
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'Space',
            'KeyR',
            'KeyV',
          ].includes(e.code)
        ) {
          e.preventDefault();
          enableAudio();
          if (e.code === 'Space') {
            if (!e.repeat) pause();
          } else if (e.code === 'KeyV') {
            if (!e.repeat)
              changeView(
                drivingViewRef.current === 'cockpit' ? 'chase' : 'cockpit',
              );
          } else if (e.code === 'KeyR') {
            if (!e.repeat) reset();
          } else {
            if(raceSession?.introducing){
              const race=raceSession.skipIntroduction();driving=race.player.driving;state=driving.car;simulationFrame=0;
              previousPose=structuredClone(state.pose);previousOpponentPose=structuredClone(race.opponent.car.pose);
            }
            held.add(e.code);
          }
        }
      };
      const up = (e: KeyboardEvent) => held.delete(e.code);
      const blur = (e: FocusEvent | Event) => {
        held.clear();
        if (
          e.type === 'blur' &&
          e.target === el &&
          e instanceof FocusEvent &&
          e.relatedTarget instanceof Node &&
          el.closest('.native-drive')?.contains(e.relatedTarget)
        )
          return;
        paused = true;
        previousPose = state.pose;
        audio?.pause();
        accumulator = 0;
        setHud((h) => ({ ...h, paused: true }));
      };
      const focus = () => {
        el.focus();
        enableAudio();
      };
      const visibility = () => {
        if (document.hidden) blur(new Event('visibilitychange'));
      };
      el.addEventListener('pointerdown', focus);
      document.addEventListener('visibilitychange', visibility);
      el.addEventListener('keydown', down);
      el.addEventListener('keyup', up);
      el.addEventListener('blur', blur);
      window.addEventListener('blur', blur);
      const backdropCanvas=backdrop?document.createElement('canvas'):null;
      if(backdropCanvas){Object.assign(backdropCanvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',imageRendering:'pixelated',pointerEvents:'none'});el.appendChild(backdropCanvas);}
      const backdropContext=backdropCanvas?.getContext('2d');
      let backdropImage:ImageData|undefined,backdropKey='';
      renderer.domElement.style.position='relative';
      el.appendChild(renderer.domElement);
      const resize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight);
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      resize();
      reset();
      renderer.setAnimationLoop(() => {
        const now = performance.now();
        if (!paused) accumulator += Math.min((now - last) / 1000, 0.15);
        last = now;
        while (!paused && accumulator >= 0.05) {
          if(raceSession&&(raceSession.replaying?simulationFrame>=raceSession.length:simulationFrame>=12000)){paused=true;accumulator=0;audio?.pause();setNotice(raceSession.replaying?'Replay finished. Seek or Reset to drive again.':'Recording complete. Replay your drive or Reset.');break;}
          const throttle = held.has('ArrowUp')
            ? 1
            : held.has('ArrowDown')
              ? 2
              : 0;
          const steering = held.has('ArrowLeft')
            ? 2
            : held.has('ArrowRight')
              ? 1
              : 0;
          try {
            previousPose = state.pose;
            if(raceSession){
              previousOpponentPose=raceSession.state.opponent.car.pose;
              const beforeCrash=state.grip.crash;
              const result=raceSession.tick(throttle|(steering<<2));
              driving=result.state.player.driving;state=driving.car;simulationFrame=driving.race.stats[2];
              audio?.impacts(state.grip.soundFlags);
              for(const effect of result.effects??[])if(effect.type==='audio')audio?.crash(effect.handle);
              if(!beforeCrash&&state.grip.crash){held.clear();setNotice('Crash. Use Reset to race again.');}
            } else if (course !== 'flat') {
              const next = stepDriving(
                driving,
                car,
                wheels,
                throttle | (steering << 2),
                { raw: track, objects, planes, walls: wallData.walls, landmarks },
                ++simulationFrame,
              );
              driving = next;
              state = next.car;
              audio?.impacts(state.grip.soundFlags);
              for(const effect of next.effects)if(effect.type==='audio')audio?.crash();
              if (next.car.crashEvents.length) {
                held.clear();
                setNotice(
                  'Crash. Use Reset to drive again.',
                );
              }
            } else
              state = stepLevel(
                state,
                car,
                wheels,
                throttle | (steering << 2),
                (p) => levelTrackContact(track, objects, p),
              );
          } catch (e) {
            paused = true;
            held.clear();
            setNotice(
              `${e instanceof Error ? e.message : 'The simulation stopped'}. Use Reset to return to the circuit.`,
            );
          }
          setWheelFrame(cockpitWheel(state.grip.steeringAngle).frame);
          setInstrumentReadings({...gaugeMemory.capture(raceSession?.state.memory),speed:state.engine.speed,rpm:state.engine.rpm,knobX:state.engine.knobX,knobY:state.engine.knobY,steeringScaled:cockpitWheel(state.grip.steeringAngle).scaled});
          setCrashView({crash:state.grip.crash,elapsed:(simulationFrame-driving.race.stats[5])&65535});
          audio?.update(state.engine.rpm,state.grip.soundFlags);
          if (paused) audio?.pause();
          accumulator -= 0.05;
        }
        place(
          paused
            ? state.pose
            : interpolatePose(previousPose, state.pose, accumulator / 0.05),
        );
        if(backdrop&&backdropCamera&&backdropCanvas&&backdropContext){
          const {angles,height}=backdropCamera,key=`${angles.join(',')}/${height}/${camera.aspect}`;
          if(key!==backdropKey){
            const frame=backdrop.render(angles,height,camera.aspect,camera.fov);
            if(!backdropImage||backdropImage.width!==frame.width){backdropCanvas.width=frame.width;backdropCanvas.height=200;backdropImage=backdropContext.createImageData(frame.width,200);}
            const rgba=backdropImage.data,palette=trackMaterials.palette;
            for(let i=0;i<frame.pixels.length;i++){const c=frame.pixels[i]*3;rgba[i*4]=palette[c];rgba[i*4+1]=palette[c+1];rgba[i*4+2]=palette[c+2];rgba[i*4+3]=255;}
            backdropContext.putImageData(backdropImage,0,0);backdropKey=key;
          }
        }
        if(orderedPresentation&&raceSession&&presentationFrame){
          renderer.resetState();
          orderedPresentation.drawCamera(raceSession.state.memory,presentationFrame,camera.aspect,camera.fov,drivingViewRef.current==='cockpit'?0:2);
          renderer.resetState();
        }else {
          if(trackVisibility&&presentationFrame){
            trackVisibility.begin(presentationFrame,camera.aspect,camera.fov);
            if(continuousVisibility){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}
            for(const placement of visibilityPlacements)if(placement.model.visible){
              const display=continuousVisibility?{matrix:visibilityMatrix.multiplyMatrices(camera.matrixWorldInverse,placement.model.matrixWorld),near:camera.near}:undefined;
              if(placement.tile!==undefined)trackVisibility.road(placement.tile,placement.origin,placement.paint,placement.visible,display);
              else trackVisibility.terrain(placement.terrain!,placement.origin,placement.visible,placement.underlay,display);
              placement.filter.set(placement.visible);
            }
          }
          renderer.render(scene,camera);
        }
        if (now - hudAt > 100) {
          setHud({
            speed: Math.round(state.engine.roadSpeed / 256),
            rpm: state.engine.rpm,
            gear: state.engine.gear,
            paused,
          });
          if(raceSession)setReplayView({active:raceSession.replaying,frame:simulationFrame,length:raceSession.introducing?0:raceSession.length});
          hudAt = now;
        }
      });
      cleanup = () => {
        audio?.close();
        el.removeEventListener('pointerdown', focus);
        document.removeEventListener('visibilitychange', visibility);
        actions.current = null;
        observer.disconnect();
        renderer.setAnimationLoop(null);
        el.removeEventListener('keydown', down);
        el.removeEventListener('keyup', up);
        el.removeEventListener('blur', blur);
        window.removeEventListener('blur', blur);
        const disposedGeometry=new Set<THREE.BufferGeometry>(),disposedMaterials=new Set<THREE.Material>();
        scene.traverse((node) => {
          if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments) {
            if(!disposedGeometry.has(node.geometry)){node.geometry.dispose();disposedGeometry.add(node.geometry);}
            (Array.isArray(node.material)
              ? node.material
              : [node.material]
            ).forEach((m) => {if(!disposedMaterials.has(m)){m.dispose();disposedMaterials.add(m);}});
          }
        });
        orderedPresentation?.dispose();
        renderer.dispose();
        // Release the old WebGL context immediately when switching courses or
        // leaving the test, instead of waiting for browser garbage collection.
        renderer.forceContextLoss();
        renderer.domElement.remove();
        backdropCanvas?.remove();
      };
    }
    void mount().catch((e) => {
      if (!disposed)
        setNotice(
          e instanceof Error ? e.message : 'The 3D test could not start',
        );
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [assets, course, gaugeMemory, originalTrackName]);
  return (
    <section className="native-drive">
      <div className="game-toolbar">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <span>Native driving test · Countach</span>
        <div className="toolbar-group">
          <Select
            value={course}
            onValueChange={(value) => {
              if (value === 'default' || value === 'original' || value === 'flat' || value === 'ramps' || value === 'banks' || value === 'curves' || value === 'loop' || value === 'tunnel' || value === 'pipe' || value === 'corkscrew' || value === 'barriers' || value === 'scenery' || value === 'hills' || value === 'large-curves' || value === 'divided') setCourse(value);
            }}
          >
            <SelectTrigger aria-label="Driving course">
              <SelectValue>
                {originalTrackName ? `${originalTrackName} · opponent race` : course === 'divided' ? 'Divided road test' : course === 'large-curves' ? 'Large curve test' : course === 'hills' ? 'Hill course' : course === 'flat' ? 'Flat circuit' : course === 'banks' ? 'Banked road' : course === 'curves' ? 'Banked curve' : course === 'loop' ? 'Loop test' : course === 'scenery' ? 'Scenery test' : course === 'barriers' ? 'Barrier test' : course === 'corkscrew' ? 'Corkscrew test' : course === 'pipe' ? 'Pipe test' : course === 'tunnel' ? 'Tunnel test' : 'Ramp course'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">DEFAULT · opponent race</SelectItem>
              <SelectItem value="original">CTRACK10 · opponent race</SelectItem>
              <SelectItem value="flat">Flat circuit</SelectItem>
              <SelectItem value="ramps">Ramp course</SelectItem>
              <SelectItem value="banks">Banked road</SelectItem>
              <SelectItem value="curves">Banked curve</SelectItem>
              <SelectItem value="loop">Loop test</SelectItem>
              <SelectItem value="tunnel">Tunnel test</SelectItem>
              <SelectItem value="pipe">Pipe test</SelectItem>
              <SelectItem value="corkscrew">Corkscrew test</SelectItem>
              <SelectItem value="barriers">Barrier test</SelectItem>
              <SelectItem value="scenery">Scenery test</SelectItem>
              <SelectItem value="hills">Hill course</SelectItem>
              <SelectItem value="large-curves">Large curve test</SelectItem>
              <SelectItem value="divided">Divided road test</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={drivingView}
            onValueChange={(value) => {
              if (value === 'cockpit' || value === 'chase') changeView(value);
            }}
          >
            <SelectTrigger aria-label="Driving view">
              <SelectValue>
                {drivingView === 'cockpit' ? 'Cockpit view' : 'Chase view'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cockpit">Cockpit view</SelectItem>
              <SelectItem value="chase">Chase view</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => actions.current?.sound()}>
            {soundLabel}
          </Button>
          <Button variant="outline" onClick={() => actions.current?.pause()}>
            {hud.paused ? 'Resume' : 'Pause'}
          </Button>
          {originalTrackName&&<Button variant="outline" disabled={replayView.length===0} onClick={()=>actions.current?.replay()}>Replay drive</Button>}
          <Button variant="outline" onClick={() => actions.current?.reset()}>
            Reset
          </Button>
        </div>
      </div>
      <div
        className={`native-screen native-${drivingView}`}
        ref={host}
        role="application"
        tabIndex={0}
        aria-label="Native driving test. Arrow keys accelerate, brake and steer; space pauses; R resets; V changes view."
      >
        {drivingView === 'cockpit' && <CockpitCrash {...crashView}/>}
        {drivingView === 'cockpit' && (
          <CockpitArtwork car="COUN" wheel={wheelFrame}>
            <CockpitInstruments {...instrumentReadings} wheel={wheelFrame}/>
          </CockpitArtwork>
        )}
        <div className="native-hud">
          <strong>
            {hud.speed}
            <small> MPH</small>
          </strong>
          <span>GEAR {hud.gear}</span>
          <span>{hud.rpm} RPM</span>
          {hud.paused && <b>PAUSED</b>}
        </div>
      </div>
      {originalTrackName&&replayView.active&&<label className="replay-timeline" style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.75rem 0'}}>
        <span>Replay {(replayView.frame/20).toFixed(2)} / {(replayView.length/20).toFixed(2)} s</span>
        <input style={{flex:1}} aria-label="Replay position" type="range" min={0} max={replayView.length} step={1} value={replayView.frame} onChange={event=>actions.current?.seek(Number(event.target.value))}/>
      </label>}
      <p role="status">{notice}</p>
      <p className="fine">
        Work in progress: original DEFAULT and CTRACK10 tracks with an opponent and replay, plus the earlier test courses.
        Graphics and audio are still being completed. Arrow keys drive; Space pauses;
        R resets; V switches between cockpit and chase view.
      </p>
    </section>
  );
}
