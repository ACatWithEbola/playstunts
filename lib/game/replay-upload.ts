import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
import {decodeOriginalReplayFile} from './replay-file.ts';
import {validateReplayEncoding} from './upload-validation.ts';
import {LEGACY_PHYSICS,resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {decodeVersionedReplay} from './versioned-replay-file.ts';
/** Private storage accepts supported MS91 slow recordings independently of
 * preview flags. This path neither submits a score nor shares a replay. */
export function preparePrivateReplayUpload(name:string,bytes:Uint8Array,directory:string,physicsEngine?:PhysicsEngineVersion):NativeStoredFile{
 return prepareReplayUpload(name,bytes,directory,physicsEngine,{experimentalMs91Slow:physicsEngine==='ms-1991'});
}
/** Validate an original recording and preserve its bytes for the native loader. */
export function prepareReplayUpload(name:string,bytes:Uint8Array,directory:string,physicsEngine?:PhysicsEngineVersion,options:{experimentalMs91Slow?:boolean}={}):NativeStoredFile{
 if(!/^[a-z0-9_-]{1,8}\.rpl$/i.test(name))throw Error('Choose a .RPL file with a name of 1–8 letters, numbers, underscores or hyphens. Rename longer filenames first.');
 const engine=resolvePhysicsEngine(physicsEngine);
 if(bytes.length>(engine===LEGACY_PHYSICS?0x722:0x724)+65535)throw Error('Replay file is too large.');
 const decoded=decodeVersionedReplay(bytes,engine),canonical=decoded.bytes;
 if(decoded.framesPerSecond!==20&&!(engine==='ms-1991'&&options.experimentalMs91Slow===true))throw Error('Only 20 Hz 1991 recordings are supported');
 const replay=decodeOriginalReplayFile(canonical);
 validateReplayEncoding(canonical);
 if(!replay.inputs.length||replay.inputs.length>12000)throw Error('Replay must contain between 1 and 12,000 recorded frames.');
 return {key:nativeFileKey(directory,name.slice(0,-4),'.RPL'),bytes:canonical,order:Date.now(),...(physicsEngine?{physicsEngine:engine}:{}),...(decoded.framesPerSecond===10?{framesPerSecond:10 as const}:{})};
}
