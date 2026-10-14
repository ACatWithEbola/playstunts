import resource from './ms91-demo-resource.json' with {type:'json'};
import {decodeVersionedReplay} from './versioned-replay-file.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Decode a separate bundled demonstration; never relabel legacy inputs. */
export function versionedDemoResource(engine:PhysicsEngineVersion){
 if(engine!=='ms-1991')return undefined;
 const file=Uint8Array.from(atob(resource.base64),c=>c.charCodeAt(0));
 if(file.length!==resource.bytes)throw Error('MS91 demonstration resource length mismatch');
 return {...decodeVersionedReplay(file,engine),physicsEngine:engine};
}
