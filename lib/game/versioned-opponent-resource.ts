import resources from './ms91-opponent-resources.json' with {type:'json'};
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Separate native cache identity is essential: packed tails affect route costs. */
export function opponentCacheName(opponent:number,engine?:PhysicsEngineVersion){return engine==='ms-1991'?'m91opp'+opponent:'opp'+opponent;}
export function versionedOpponentResource(name:string,engine?:PhysicsEngineVersion):Uint8Array|undefined{
 if(engine!=='ms-1991')return;
 const match=/^(?:M91)?OPP([1-6])\.PRE$/i.exec(name.replaceAll('/','\\').split('\\').pop()!);
 if(!match)return;
 const entry=resources.files[('OPP'+match[1]+'.PRE') as keyof typeof resources.files];
 const bytes=Uint8Array.from(atob(entry.base64),character=>character.charCodeAt(0));
 if(bytes.length!==entry.bytes)throw Error('MS91 opponent packed resource length mismatch');
 return bytes;
}
