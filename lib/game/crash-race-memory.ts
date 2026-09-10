import {readPlayerDrivingState} from './initialized-player-driving.ts';
import {updateCrashState} from './crash-state.ts';
import {generateParticles} from './particles.ts';
/** Original B3B2 with live shared race memory and real particle generation.
 * Audio requests are returned for the active native driver to execute. */
export function crashOriginalRaceMemory(memory:Uint8Array,d:number,cause:1|2|3|4|5,selected:0|1){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>view.getUint16(d+at,true),base=0x8c38+selected*0xb8;
 const decoded=readPlayerDrivingState(memory.subarray(d,d+65536)),before={...decoded.driving.race,crash:memory[d+base+0xb1],speed:word(base+0x2a),roadSpeed:word(base+0x2c),yaw:word(base+0x18)};
 const result=updateCrashState(before,cause,selected),state=result.state;
 let particles=decoded.driving.particles;
 for(const effect of result.effects)if(effect.type==='particles')particles=generateParticles(particles,effect.car,effect.yaw,effect.mode);
 const set=(at:number,value:number)=>view.setUint16(d+at,value,true);
 memory[d+base+0xb1]=state.crash;set(base+0x2a,state.speed);set(base+0x2c,state.roadSpeed);
 set(0x8c1e,state.abortFlag);set(0x8c20,state.timer);memory[d+0x8eac]=state.evaluationCause;
 state.stats.forEach((value,i)=>set(0x8c22+i*2,value));state.savedStats.forEach((value,i)=>set(0x899a+i*2,value));
 memory.set(particles.random,d+0x9f5c);memory[d+0x8ee0]=particles.active;
 particles.particles.forEach((p,i)=>{
  for(const [at,value] of [[0x8ae6,p.x],[0x8b46,p.y],[0x8ba6,p.z]])view.setInt32(d+at+i*4,value,true);
  for(const [at,value] of [[0x8db4,p.angleX],[0x8de4,p.angleZ],[0x8e14,p.heading],[0x8e44,p.speed],[0x8e74,p.verticalSpeed]])set(at+i*2,value);
  memory[d+0x8ee1+i]=p.style;memory[d+0x8ef9+i]=p.owner;
 });
 return result.effects;
}
