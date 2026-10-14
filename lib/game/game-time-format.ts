import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
/** Supplied1bbf2..1bcba: signed20Hz time, two-character fields, optional
 * hundredths. The original field formatter truncates excess leading digits. */
export function originalGameTime(ticks:number,fractions=true){
 ticks=ticks<<16>>16;
 const minutes=Math.trunc(ticks/1200),seconds=Math.trunc(ticks%1200/20),hundredths=ticks%20*5;
 const field=(value:number,zero:boolean)=>{const result=String(value).slice(-2).padStart(2,' ');return zero?result.replace(/^ /,'0'):result;};
 return field(minutes,false)+':'+field(seconds,true)+(fractions?'.'+field(hundredths,true):'');
}
/** MS91 image1bc70..1bd45 uses unsigned tick divisions and active cadence.
 * Kept separate so legacy signed formatting and replay interpretation stay intact. */
export function ms91GameTime(ticks:number,fractions=true,framesPerSecond:10|20=20){
 const count=ticks&65535,minuteFrames=60*framesPerSecond;
 const minutes=Math.trunc(count/minuteFrames),remaining=count%minuteFrames;
 const seconds=Math.trunc(remaining/framesPerSecond),hundredths=remaining%framesPerSecond*(100/framesPerSecond);
 const field=(value:number,zero:boolean)=>{const result=String(value).slice(-2).padStart(2,' ');return zero?result.replace(/^ /,'0'):result;};
 return field(minutes,false)+':'+field(seconds,true)+(fractions?'.'+field(hundredths,true):'');
}
/** Engine routing is caller-owned; missing metadata never upgrades old displays. */
export function versionedGameTime(ticks:number,fractions=true,engine?:PhysicsEngineVersion,framesPerSecond?:10|20){
 const version=resolvePhysicsEngine(engine),rate=resolveReplayCadence(framesPerSecond);
 if(version==='ms-1991')return ms91GameTime(ticks,fractions,rate);
 if(rate!==20)throw Error('Cadence-aware time formatting is only verified for MS91');
 return originalGameTime(ticks,fractions);
}
