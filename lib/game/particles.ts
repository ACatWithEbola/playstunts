/** Original shared 24-slot particle system, loaded 0xb7f4 / 0xb97c. */
import {i16,vecTransform} from '../physics/math.ts';
import {rotateZXY} from '../physics/rotation.ts';
export interface Particle {x:number;y:number;z:number;angleX:number;angleZ:number;heading:number;speed:number;verticalSpeed:number;style:number;owner:number}
export interface Particles {random:number[];active:number;particles:Particle[]}
function signedShift(n:number,bits:number){n=i16(n);const sign=n<0?-1:0;return i16(((i16((n^sign)-sign)>>bits)^sign)-sign);}
function clone(s:Particles):Particles{return {...s,random:[...s.random],particles:s.particles.map(p=>({...p}))};}
/** Original six-byte additive generator; all additions and carry wrap as bytes. */
function randomByte(s:number[]){let a=s[5];for(let i=4;i>=0;i--){a=(a+s[i])&255;s[i]=a;}for(let i=5;i>=0;i--){s[i]=(s[i]+1)&255;if(s[i])break;}return s[0];}
export function generateParticles(before:Particles,owner:number,yaw:number,speed:number):Particles {
 const s=clone(before),crash=owner<2;
 const count=Math.min(s.particles.filter(p=>p.speed===0).length,crash?18:8);
 const start=crash?yaw:i16(yaw-96),span=crash?1024:192,style=crash?owner*4+4:0;
 s.active=1;let index=0;
 for(const p of s.particles){
  if(p.speed!==0)continue;
  p.owner=owner&255;p.style=((index&3)+style)&255;p.x=p.y=p.z=0;
  p.angleX=i16(randomByte(s.random)<<2);p.angleZ=i16(randomByte(s.random)<<2);
  p.heading=(Math.trunc(span*index/count)+start)&1023;
  p.speed=i16(signedShift(randomByte(s.random)*24<<6,8)+speed+384);
  p.verticalSpeed=signedShift((crash?6:1)*p.speed,2);
  index++;if(index===count)break;
 }
 return s;
}
export function advanceParticles(before:Particles,playerHeight:number):Particles {
 const s=clone(before);s.active=0;
 for(const p of s.particles){
  if(p.speed===0)continue;
  const v=vecTransform([0,0,p.speed],rotateZXY(0,0,p.heading));
  p.x=(p.x+v[0])|0;p.z=(p.z+v[2])|0;
  p.verticalSpeed=i16(p.verticalSpeed-19);p.y=(p.y+p.verticalSpeed)|0;
  // Original uses the player's height for every owner in this shared system.
  if(((p.y+playerHeight)|0)<0)p.speed=0;
  else {s.active=1;p.angleX=i16(p.angleX+16);p.angleZ=i16(p.angleZ+16);}
 }
 return s;
}
