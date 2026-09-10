import {raceCarContact} from './race-car-contact.ts';
import {landmarkContact} from './landmark-contact.ts';
import {carsOverlap} from './car-overlap.ts';
import {roadsidePosts} from './roadside-posts.ts';
/** Track-aware simulation; only reconstructed geometry is accepted. */
import { stepEngine, type EngineState, type EngineTuning } from './engine.ts';
import { stepSteering } from './steering.ts';
import { stepGrip, type GripState, type GripTuning } from './grip.ts';
import { reconstructPose } from './chassis.ts';
import { trackContact, type CrashImpact, type TrackGeometry } from './track-contact.ts';
import { i16, vecTransform, type Vector } from './math.ts';
import { rotateZXY } from './rotation.ts';
import type { LevelState } from './level-step.ts';
export function stepTrack(
  before: LevelState,
  tuning: EngineTuning & GripTuning,
  wheels: Vector[],
  input: number,
  track: TrackGeometry,
): LevelState & { crashEvents: number[]; crashImpacts:CrashImpact[]; engineRoadSpeed:number; contactPasses: number } {
  if (!before.wheelPositions)
    throw Error('Track simulation requires original wheel-position history');
  // Original player_op file 0x9858-0x9887 stops updates after a crashed car
  // has zero road/engine speed and all four fall velocities have settled.
  if (before.grip.crash && before.engine.roadSpeed === 0 && before.engine.speed === 0 && before.suspension.rc1.every(n => n === 0))
    return {...before,grip:{...before.grip,soundFlags:0},crashEvents:[],crashImpacts:[],engineRoadSpeed:before.engine.roadSpeed,contactPasses:0};
  // Original player_op (file 0x9854) replaces controls with braking after a crash.
  if (before.grip.crash) input = 2;
  let contactScratch:number[]|undefined;
  const retainContactScratch=(words:[number,number])=>{if(before.contactEntryRegisters)contactScratch=[...words,...before.contactEntryRegisters];};
  let engine = stepEngine(before.engine, tuning, input, 20,undefined,retainContactScratch);
  const engineRoadSpeed = engine.roadSpeed;
  const steeringAngle = stepSteering(
    before.grip.steeringAngle,
    engine.roadSpeed,
    ((input >> 2) & 3) as 0 | 1 | 2 | 3,
    20,
  );
  const grip = stepGrip(
    {
      ...before.grip,
      soundFlags: before.grip.crash && before.engine.roadSpeed === 0 ? 0 : 1,
      speed: engine.speed,
      roadSpeed: engine.roadSpeed,
      steeringAngle,
    },
    tuning,
    true,
    // Original grip 0x18a60 reads the car position high bytes and resolves
    // continuation tiles before applying the banked-curve roll adjustment.
    (()=>{
      let column=(before.pose.position[0]>>>16)&255,row=(before.pose.position[2]>>>16)&255;
      const id=track.raw[row*30+column];
      if(id===253){column--;row++;}else if(id===254)row++;else if(id===255)column--;
      return track.raw[row*30+column];
    })(),
    retainContactScratch,
  );
  return moveTrack(before,wheels,track,engine,grip,engineRoadSpeed,contactScratch);
}
/** Shared movement stage after engine and grip; car-specific event handling remains with the caller. */
export function moveTrack(before:LevelState,wheels:Vector[],track:TrackGeometry,engine:EngineState,grip:GripState,engineRoadSpeed:number,contactScratch?:number[]):ReturnType<typeof stepTrack>{
  if(!before.wheelPositions)throw Error('Track simulation requires original wheel-position history');
  const rotation: Vector = [
    grip.yaw,
    before.pose.rotation[1],
    before.pose.rotation[2],
  ];
  const contact = trackContact(
    { ...before.pose, rotation, ...grip, suspension: before.suspension.rc2 },
    wheels,
    before.wheelPositions,
    before.suspension,
    track,
    grip.crash,
    grip.soundFlags,
    before.contactWheelAngles,
    contactScratch,
    before.grip.surfaces,
  );
  let pose = reconstructPose(contact.centres);
  // Steering has already updated the stored yaw before original 74DE.
  // Contact exits at 8F76 skip the proposed pose commit; they do not undo
  // that earlier yaw update (rear-end oracle first exposed this at tick134).
  let contactLandmarkMisses=0,landmarkHit=false,postHit=false,carHit=false,contactFlag=before.contactFlag,contactOther:LevelState['contactOther'],contactCrashOther=false,contactSpeed:number|undefined;
  if(track.otherCar){
   const other=track.otherCar,body={position:pose.position.map(v=>v>>6) as Vector,angles:[pose.rotation[2],pose.rotation[1],pose.rotation[0]] as Vector,dimensions:other.dimensions,radius:other.radius};
   const collision=raceCarContact(true,other.selected,[body,other.body],[{yaw:rotation[0],speed:contact.speedStopped?0:grip.speed,roadSpeed:contact.roadSpeed,wheelAngle:contact.wheelAngle,contact:before.contactFlag??0},other.state]);
   carHit=collision.suppressPose;
   if(carHit){
    const own=collision.cars[0];contact.roadSpeed=own.roadSpeed;contactSpeed=own.speed;contact.wheelAngle=own.wheelAngle;contactFlag=own.contact;contactOther=collision.cars[1];
    if(collision.crashCars.includes(other.selected)&&!contact.crash){contact.crash=1;contact.crashEvents.push(1);contact.crashImpacts.push({cause:1,yaw:rotation[0],roadSpeed:contact.roadSpeed});}
    contactCrashOther=collision.crashCars.includes((other.selected^1) as 0|1);
    pose={...pose,position:before.pose.position,rotation:[rotation[0],before.pose.rotation[1],before.pose.rotation[2]]};
   }
  }
  const landmark=track.landmarks;
  if(!carHit&&landmark){
   const body={position:pose.position.map(v=>(v>>6)) as Vector,angles:[pose.rotation[2],pose.rotation[1],pose.rotation[0]] as Vector,dimensions:landmark.dimensions,radius:landmark.radius};
   const result=landmarkContact(body,track.raw,track.objects,landmark.hillHeight,contact.wheelAngle);
   contactLandmarkMisses=result.misses;landmarkHit=result.hit;contact.wheelAngle=result.wheelAngle;
   if(landmarkHit){
    if(!contact.crash){contact.crash=1;contact.crashEvents.push(1);contact.crashImpacts.push({cause:1,yaw:rotation[0],roadSpeed:contact.roadSpeed});}
    pose={...pose,position:before.pose.position,rotation:[rotation[0],before.pose.rotation[1],before.pose.rotation[2]]};
   }
  }
  const posts=track.posts;
  if(!carHit&&!landmarkHit&&posts&&(pose.position[0]>>16)===posts.column&&29-(pose.position[2]>>16)===posts.terrainRow){
   const body={position:pose.position.map(v=>(v>>6)) as Vector,angles:[pose.rotation[2],pose.rotation[1],pose.rotation[0]] as Vector,dimensions:posts.dimensions,radius:posts.radius};
   if(roadsidePosts(posts.column,posts.terrainRow,posts.height,posts.heading).some(post=>carsOverlap(body,post))){
    postHit=true;
    if(!contact.crash){contact.crash=1;contact.crashEvents.push(1);contact.crashImpacts.push({cause:1,yaw:rotation[0],roadSpeed:contact.roadSpeed});}
    pose={...pose,position:before.pose.position,rotation:[rotation[0],before.pose.rotation[1],before.pose.rotation[2]]};
   }
  }
  const
    all = contact.surfaces.reduce((a, b) => a + b, 0),
    rear = contact.surfaces[2] + contact.surfaces[3];
  const gravity =
    rotation[1] || rotation[2]
      ? -vecTransform(
          [0, 0, 130],
          rotateZXY(-rotation[2], -rotation[1], -rotation[0]),
        )[1]
      : 0;
  engine = {
    ...engine,
    speed: contactSpeed??(contact.speedStopped ? 0 : grip.speed),
    roadSpeed: contact.roadSpeed,
    rearContact: rear,
    allContact: all,
    gravity: gravity || 0,
  };
  if(!carHit&&!landmarkHit&&!postHit&&contactFlag!==undefined)contactFlag=0;
  return {
    ...(contactFlag===undefined?{}:{contactFlag}),
    ...(track.otherCar?{contactOther,contactCrashOther}:{}),
    pose,
    engine,
    grip: {
      ...grip,
      speed: engine.speed,
      roadSpeed: engine.roadSpeed,
      yaw: pose.rotation[0],
      roll: pose.rotation[2],
      surfaces: contact.surfaces,
      allContact: all,
      crash: contact.crash,
      soundFlags: contact.soundFlags,
      wheelAngle: contact.wheelAngle,
    },
    suspension: contact.suspension,
    wheelPositions: contact.wheelPositions,
    crashEvents: contact.crashEvents,
    crashImpacts: contact.crashImpacts,
    engineRoadSpeed,
    contactPasses: contact.passes,
    contactWheelAngles: contact.contactWheelAngles,
    contactOrigins: contact.contactOrigins,
    contactFrontAngle: contact.contactFrontAngle,
    contactLandmarkMisses,
    contactEntryRegisters: before.contactEntryRegisters,
  };
}
