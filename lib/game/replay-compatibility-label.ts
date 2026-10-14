import {resolvePhysicsEngine} from '../physics/engine-version.ts';
/** Metadata, never file-size inference, selects the recorded game's label.
 * New-engine publication remains subject to the compatibility release gate. */
export function replayCompatibilityLabel(value:unknown){
 if(value===undefined||value===null)throw Error('Missing replay engine metadata');
 const engine=resolvePhysicsEngine(value);
 if(engine==='ms-1991')return 'Compatible with Mindscape’s 4D Sports Driving v1.1 — 25 February 1991 (MS 1991).';
 if(engine==='bb-1991')return 'Compatible with Brøderbund Stunts v1.1 — 12 February 1991 (BB 1.1).';
 return 'Compatible with Mindscape’s 4D Sports Driving v1.1 — 13 December 1990 (MS 1990).';
}
