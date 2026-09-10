/** Reconstructed engine/gearbox step, based on Restunts statecar.c.
 * Fixed-width arithmetic is intentional. Collision, tyre contact, steering,
 * position integration and opponents are separate and not implemented here.
 * This module must pass comparisons against the supplied game before use in play.
 */
import { i16,u16 } from './math.ts';
import {opponentEngineForce} from './opponent-engine-force.ts';
export interface EngineState {speed:number;roadSpeed:number;lastSpeed:number;speedDiff:number;rpm:number;lastRPM:number;gear:number;ratio:number;ratioHigh:number;gravity:number;rearContact:number;allContact:number;automatic:number;shifting:number;shiftTimer:number;limiter:number;knobX:number;knobY:number;targetX:number;targetY:number;accelerating:number;braking:number}
export interface EngineTuning {gears:number;mass:number;braking:number;idleRPM:number;downshiftRPM:number;upshiftRPM:number;maxRPM:number;gearRatios:number[];gearKnobPoints:number[][];idleTorque:number;torqueCurve:number[];aeroResistance:number}
export function rpmFromSpeed(rpm:number,speed:number,ratio:number,shifting:number,idle:number){return Math.max(shifting?u16(rpm):Math.floor(u16(speed)*u16(ratio)/65536),u16(idle))}
/** Original 0xa419-0xa42a uses unsigned long division, truncates to a
 * signed word, then divides by two toward zero. Negative force must retain
 * this wraparound behavior; ordinary signed division changes loop motion. */
export function engineForceDelta(force:number,mass:number){return i16(Math.trunc(i16(Math.floor((Math.imul(i16(force),25)>>>0)/(mass&65535)))/2));}
export function stepEngine(before:EngineState,t:EngineTuning,input:number,fps:10|20=20,opponentSpeedByte?:number,onContactScratch?:(words:[number,number])=>void):EngineState{
 const s={...before};const knobStep=fps===20?6:12;s.limiter=(s.limiter? s.limiter-1:0)&255;s.speedDiff=i16(s.roadSpeed-s.lastSpeed);s.lastSpeed=s.roadSpeed;s.lastRPM=s.rpm;
 let shift=0;
 if(!s.automatic&&!s.shifting){if(input&16)shift=1;else if(input&32)shift=-1}
 else if(s.gear&&!s.shifting&&s.rearContact){if(s.rpm>t.upshiftRPM)shift=1;else if(s.rpm<t.downshiftRPM)shift=-1}
 if((shift===1&&s.gear!==t.gears)||(shift===-1&&s.gear>1)){s.gear+=shift;s.shifting=1;s.shiftTimer=fps+(fps>>1);[s.targetX,s.targetY]=t.gearKnobPoints[s.gear]}
 const approach=(a:number,b:number)=>i16(a+Math.sign(b-a)*Math.min(Math.abs(i16(b-a)),knobStep));
 if(s.shifting){if(s.knobX===s.targetX){if(s.knobY===s.targetY){s.shifting=0;s.ratio=t.gearRatios[s.gear];s.ratioHigh=s.ratio>>>8}else s.knobY=approach(s.knobY,s.targetY)}else if(s.knobY===t.gearKnobPoints[0][1])s.knobX=approach(s.knobX,s.targetX);else s.knobY=approach(s.knobY,t.gearKnobPoints[0][1])}else if(s.shiftTimer)s.shiftTimer--;
 let speed=u16(s.speed);let delta=i16(s.gravity-((t.aeroResistance*(speed>>>10)*(speed>>>10))>>9));
 if(s.rpm>t.maxRPM){s.rpm=t.maxRPM-1;delta=i16(delta-t.braking)}
 else if((input&3)===2){s.accelerating=0;s.limiter=0;s.braking=1;delta=i16(delta-t.braking*(opponentSpeedByte===undefined?1:2))}
 else if((input&3)!==1){s.accelerating=0;s.braking=0}
 else {s.braking=0;s.accelerating=1;
  if(s.shifting){s.limiter=0;s.rpm=i16(s.rpm-(fps===10?80:40))}
  else if(!s.rearContact){if(s.rpm<t.maxRPM&&speed<64000)delta=i16(delta+768)}
  else {let torque=(s.gear<=1&&s.rpm<2600)?t.idleTorque:t.torqueCurve[s.rpm>>>7];if(torque===undefined)throw Error('RPM outside original torque table');if(s.limiter&&s.rpm<5000)torque=(t.idleTorque+torque)>>1;delta=i16(delta+((s.ratioHigh*torque&65535)>>>4));delta=engineForceDelta(delta,t.mass);if(opponentSpeedByte!==undefined)delta=opponentEngineForce(delta,opponentSpeedByte);if(delta>296)s.limiter=5}
 }
 if(fps===10)delta=i16(delta*2);
 if(delta<0&&-delta>speed)speed=0;else {const high=speed>=32768;speed=u16(speed+delta);if(delta>=0&&high&&(speed<32768||speed>62720))speed=62720}
 if(s.rearContact){let difference=i16(s.roadSpeed-speed);if(difference<0)difference=i16(-difference);if(difference>5120){s.speed=(s.speed+s.roadSpeed)>>>1;s.roadSpeed=s.speed;s.limiter=5}else{s.speed=speed;s.roadSpeed=speed}}else s.speed=speed;
 // Original A517/A51A leaves these arguments in the later contact locals.
 onContactScratch?.([i16(s.rpm),i16(s.speed)]);
 s.rpm=i16(rpmFromSpeed(s.rpm,s.speed,s.ratio,s.shifting,t.idleRPM));
 if(s.allContact&&s.lastRPM>s.rpm){if(i16(s.lastRPM-s.rpm)>2000){if(i16(t.idleTorque*s.ratioHigh)>12000)s.limiter=30}else if(i16(s.rpm-s.lastRPM)>2000){s.limiter=10;s.roadSpeed=u16(s.roadSpeed-1280)}}
 return s;
}
