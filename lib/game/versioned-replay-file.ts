import {decodeOriginalReplayFile} from './replay-file.ts';
import {resolvePhysicsEngine,LEGACY_PHYSICS,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
/** Stored simulation bank remains canonical legacy layout. Export is a copy;
 * selecting a format is NOT physics conversion. Only export the race's engine. */
export function exportVersionedReplay(canonical:Uint8Array,engine:PhysicsEngineVersion):Uint8Array {
 return encodeVersionedReplay(canonical,engine,20);
}
/** Explicit cadence-aware copy for verified callers. Legacy format cannot
 * represent alternate cadence; never silently discard that metadata. */
export function encodeVersionedReplay(canonical:Uint8Array,engine:PhysicsEngineVersion,framesPerSecond:ReplayCadence):Uint8Array {
 const rate=resolveReplayCadence(framesPerSecond);
 const version=resolvePhysicsEngine(engine),replay=decodeOriginalReplayFile(canonical);
 if(replay.trailing.length)throw Error('Canonical recording has trailing data');
 if(version===LEGACY_PHYSICS){if(rate!==20)throw Error('Legacy replay format requires20 Hz');return Uint8Array.from(canonical);}
 const result=new Uint8Array(canonical.length+2);
 result.set(canonical.subarray(0,22));
 result[22]=rate;result[23]=0;
 result.set(canonical.subarray(22,24),24);
 result.set(canonical.subarray(24),26);
 return result;
}
/** Explicit format selected by caller; never infer physics from matching sizes. */
export function importVersionedReplay(file:Uint8Array,engine:PhysicsEngineVersion):Uint8Array {
 const decoded=decodeVersionedReplay(file,engine);
 if(decoded.framesPerSecond!==20)throw Error('Only 20 Hz 1991 recordings are supported');
 return decoded.bytes;
}
/** Cadence-aware format inspection. Callers must preserve both returned fields;
 * this does not authorize loading unsupported rates into a live session. */
export function decodeVersionedReplay(file:Uint8Array,engine:PhysicsEngineVersion):{bytes:Uint8Array;framesPerSecond:ReplayCadence}{
 const version=resolvePhysicsEngine(engine);
 if(version===LEGACY_PHYSICS){decodeOriginalReplayFile(file);return {bytes:Uint8Array.from(file),framesPerSecond:20};}
 if(file.length<0x724)throw Error('1991 replay is shorter than its header and track');
 const view=new DataView(file.buffer,file.byteOffset,file.byteLength);
 const framesPerSecond=resolveReplayCadence(view.getUint16(22,true));
 if(file.length!==0x724+view.getUint16(24,true))throw Error('Invalid 1991 recording length');
 const result=new Uint8Array(file.length-2);
 result.set(file.subarray(0,22));result.set(file.subarray(24,26),22);result.set(file.subarray(26),24);
 decodeOriginalReplayFile(result);
 return {bytes:result,framesPerSecond};
}
