import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original003f initializes registers0..254, intentionally excluding255. */
export function initializeMs91AdlibRegisterCache(driver:Uint8Array){
 if(driver.length<0xa7d)throw Error('MS1991 OPL cache is incomplete');
 const writes:number[][]=[];
 for(let register=0;register<255;register++){
  driver[0x97d+register]=1;
  writes.push(...versionedAdlibRegisterWrites(driver,[[register,0]],'ms-1991'));
 }
 return writes;
}
/** MS1991 AD15:07C7 suppresses writes equal to its retained register cache.
 * Input/output are OPL register pairs, not timed physical port transactions. */
export function versionedAdlibRegisterWrites(driver:Uint8Array,writes:readonly number[][],generation?:PhysicsEngineVersion){
 for(const pair of writes)if(pair.length!==2||pair.some(n=>!Number.isInteger(n)||n<0||n>255))throw Error('Invalid OPL register write');
 if(generation!=='ms-1991')return writes.map(pair=>pair.slice());
 if(driver.length<0xa7d)throw Error('MS1991 OPL cache is incomplete');
 const emitted:number[][]=[];
 for(const [register,value] of writes){
  if(driver[0x97d+register]===value)continue;
  driver[0x97d+register]=value;emitted.push([register,value]);
 }
 return emitted;
}
