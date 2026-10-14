import entry from './ms91-td15-resource.json' with {type:'json'};
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Exact modern sound-driver copy; legacy catalog remains unchanged. */
export function versionedTd15Resource(generation?:PhysicsEngineVersion){
 if(generation!=='ms-1991')return;
 const bytes=Uint8Array.from(atob(entry.base64),c=>c.charCodeAt(0));
 if(bytes.length!==3241||bytes.length!==entry.bytes)throw Error('Incomplete modern TD15 resource');
 return bytes;
}
