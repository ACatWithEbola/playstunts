import {soundResourceOffset} from './sound-resource.ts';
import {opponentPath} from '../physics/opponent-path.ts';
import {versionedOpponentSpeeds} from './versioned-opponent-speeds.ts';

/** Original opponent setup reads route costs beyond the sixteen-byte sped
 * item. Keep that read in retained allocation memory, including packed tails.
 * Resource allocation and release belong to the surrounding loader.
 */
export function prepareOpponentPathMemory(before:Uint8Array,dataSegment:number,resourceAddress:number,resourceSize:number,route:{primary:number[];secondary:number[];tiles:number[]},mode:'mcga'|'cga'|'tandy'|'ega'='mcga',physicsEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const bank=before.subarray(resourceAddress,resourceAddress+resourceSize);
 const sped=soundResourceOffset(bank,Uint8Array.from([115,112,101,100]));
 if(sped===null)throw Error('Opponent resource has no sped item');
 const costs=resourceAddress+sped;
 if(costs+256>before.length)throw Error('Opponent costs extend outside retained memory');
 const memory=before.slice(),profile=versionedOpponentSpeeds(before.subarray(costs,costs+16),before[dataSegment+0x8fc8+high],physicsEngine);
 memory.set(profile,costs);
 const path=opponentPath(route.primary,route.secondary,route.tiles,Array.from(memory.subarray(costs,costs+256)));
 memory.set(profile,dataSegment+0x9362+high);
 if(path){
  const v=new DataView(memory.buffer),segment=v.getUint16(dataSegment+0x7ff6+high,true),offset=v.getUint16(dataSegment+0x7ff4+high,true);
  path.forEach((value,i)=>v.setUint16(segment*16+((offset+i*2)&65535),value,true));
 }
 return {memory,path};
}
