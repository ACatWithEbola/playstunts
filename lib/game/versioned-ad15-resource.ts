import entry from './ms91-ad15-resource.json' with {type:'json'};
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export function versionedAd15Resource(generation?:PhysicsEngineVersion){
 if(generation!=='ms-1991')return;
 const bytes=Uint8Array.from(atob(entry.base64),c=>c.charCodeAt(0));
 if(bytes.length!==entry.bytes)throw Error('Incomplete MS1991 AD15 resource');
 return bytes;
}
