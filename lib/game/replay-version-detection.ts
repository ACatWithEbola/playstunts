import {decodeVersionedReplay} from './versioned-replay-file.ts';
import {validateReplayEncoding} from './upload-validation.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';

/** Inspect layout and supported fields, not driving physics. Identical 1991
 * layouts cannot identify the publisher; callers must retain that ambiguity. */
export function detectReplayVersions(bytes:Uint8Array):PhysicsEngineVersion[]{
 const candidates:PhysicsEngineVersion[]=[];
 for(const engine of ['ms-1990','ms-1991','bb-1991'] as const){
  try{
   const decoded=decodeVersionedReplay(bytes,engine);
   validateReplayEncoding(decoded.bytes);
   // Playback support is a separate upload gate. Rejecting an unsupported
   // publisher/rate must not make identical bytes appear uniquely identified.
   candidates.push(engine);
  }catch{/* A failed candidate does not invalidate another supported layout. */}
 }
 return candidates;
}
