import type {PlayerDrivingState} from './player-driving-step.ts';
import type {RaceCameraState} from '../physics/race-cameras.ts';
/** Write reconstructed fields into retained original-format state for replay checkpoints.
 * Untouched/unknown bytes remain from the supplied data segment.
 */
export function writePlayerRaceState(before:Uint8Array,previous:PlayerDrivingState,current:PlayerDrivingState,camera:RaceCameraState,done:number,carUpdated=true){
 if(before.length!==65536)throw Error('Expected the complete original data segment');
 const out=before.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength),word=(at:number,n:number)=>v.setUint16(at,n,true),byte=(at:number,n:number)=>v.setUint8(at,n),vector=(at:number,values:readonly number[])=>values.forEach((n,i)=>word(at+i*2,n));
 const {car,race,particles}=current.driving,{engine:e,grip:g,suspension:s}=car,{progress:p,guidance:n}=current.navigation,base=0x8c38;
 if(carUpdated){
 car.pose.position.forEach((value,i)=>v.setInt32(base+i*4,value,true));vector(base+24,car.pose.rotation);
 const prior=previous.driving.car;
 if(!(prior.grip.crash&&prior.engine.speed===0&&prior.engine.roadSpeed===0&&prior.suspension.rc1.every(n=>n===0)))prior.pose.position.forEach((value,i)=>v.setInt32(base+12+i*4,value,true));
 for(const [off,value] of [[0x1e,e.gravity],[0x20,g.steeringAngle],[0x22,e.rpm],[0x24,e.lastRPM],[0x28,e.speedDiff],[0x2a,e.speed],[0x2c,e.roadSpeed],[0x2e,e.lastSpeed],[0x30,e.ratio],[0x32,e.ratioHigh],[0x34,e.knobX],[0x36,g.wheelAngle],[0x38,e.knobY],[0x3a,e.targetX],[0x3c,e.targetY],[0x3e,g.spin],[0x40,g.frontWheelAngle],[0x42,g.slip],[0x44,g.demandedGrip],[0x46,g.surfaceGrip],[0x48,n.angle],[0x4a,n.routeIndex]])word(base+off,value);
 for(const [off,values] of [[0x4c,s.rc1],[0x54,s.rc2],[0x64,s.rc4],[0x6c,s.rc5]] as const)vector(base+off,values);
 if(!car.wheelPositions||!n.targetFirst||!n.targetSecond)throw Error('Complete original wheel and route-target state is required');
 car.wheelPositions.forEach((values,i)=>vector(base+0x74+i*6,values));vector(base+0x8c,n.target);vector(base+0x92,n.targetFirst);vector(base+0x98,n.targetSecond);word(base+0x9e,n.wheelAngle);
 for(const [off,value] of [[0xa4,e.braking],[0xa5,e.accelerating],[0xa6,e.gear],[0xa7,g.surfaces[0]+g.surfaces[1]],[0xa8,e.rearContact],[0xa9,e.allContact],[0xae,e.limiter],[0xaf,g.sliding],[0xb1,g.crash],[0xb2,e.shifting],[0xb3,e.shiftTimer],[0xb4,e.automatic],[0xb5,p.laps],[0xb6,n.point],[0xb7,g.soundFlags]])byte(base+off,value);
 if(car.contactFlag!==undefined)byte(base+0xb0,car.contactFlag);
 g.surfaces.forEach((value,i)=>byte(base+0xaa+i,value));
 }
 vector(0x8c22,race.stats);vector(0x899a,race.savedStats);word(0x8c1e,race.abortFlag);word(0x8c20,race.timer);byte(0x8eac,race.evaluationCause);word(0xa034,race.elapsed);
 if(p.totalPenalty!==(race.stats[7]&65535))throw Error('Penalty state disagrees with original shared race record');
 word(0x8da8,p.route);word(0x8daa,p.lastRoute);vector(0x8dac,current.navigation.cache);word(0xa7da,p.lastPenalty);byte(0x8fbd,p.penaltyDisplay);byte(0x8f11,p.status);byte(0x8f12,p.confirmations);byte(0x8f13,n.warning);
 vector(0x8c06,camera.position);vector(0x8c12,camera.previous);byte(0x8ead,camera.selected);byte(0x8ff4,done);
 particles.random.forEach((value,i)=>byte(0x9f5c+i,value));byte(0x8ee0,particles.active);
 particles.particles.forEach((particle,i)=>{
  for(const [off,value] of [[0x8ae6,particle.x],[0x8b46,particle.y],[0x8ba6,particle.z]])v.setInt32(off+i*4,value,true);
  for(const [off,value] of [[0x8db4,particle.angleX],[0x8de4,particle.angleZ],[0x8e14,particle.heading],[0x8e44,particle.speed],[0x8e74,particle.verticalSpeed]])word(off+i*2,value);
  byte(0x8ee1+i,particle.style);byte(0x8ef9+i,particle.owner);
 });
 return out;
}
