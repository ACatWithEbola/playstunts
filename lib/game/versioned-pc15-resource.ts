import resources from './ms91-pc15-resources.json' with {type:'json'};
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original modern audio assets are separate copies; legacy catalog unchanged. */
export function versionedPc15Resource(name:string,engine?:PhysicsEngineVersion):Uint8Array|undefined{
 if(engine!=='ms-1991')return;
 const key=name.replaceAll('/','\\').split('\\').pop()!.toUpperCase();
 if(key!=='PC15.DRV'&&key!=='PCENG1.VCE')return;
 const entry=resources.files[key],bytes=Uint8Array.from(atob(entry.base64),c=>c.charCodeAt(0));
 if(bytes.length!==entry.bytes)throw Error('MS1991 PC15 resource length mismatch');
 return bytes;
}
