import type {NativeStoredFile} from './native-file-store.ts';
import {LEGACY_PHYSICS,resolvePhysicsEngine} from '../physics/engine-version.ts';
import {encodeVersionedReplay} from './versioned-replay-file.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
/** Copy-only external file export. JSON backups retain internal canonical bytes. */
export function nativeFileDownload(file:NativeStoredFile):Uint8Array{
 if(!/\.RPL$/i.test(file.key))return Uint8Array.from(file.bytes);
 // Preserve explicit recorded timing. This is a format copy, not conversion
 // of controls or permission to play an unsupported browser session.
 const engine=resolvePhysicsEngine(file.physicsEngine),rate=resolveReplayCadence(file.framesPerSecond);
 if(rate===10&&engine!=='ms-1991')throw Error('10 Hz replay downloads require the verified MS91 format');
 return engine===LEGACY_PHYSICS?Uint8Array.from(file.bytes):encodeVersionedReplay(file.bytes,engine,rate);
}
