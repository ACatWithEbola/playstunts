/** MS91 descriptor08 gates bounds writes; legacy callers retain their
 * unconditional region behavior until explicitly opting into that policy. */
export function originalModelTracksRegion(flags:number,ms91Policy=false){return !ms91Policy||!!(flags&8);}
