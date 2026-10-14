import {uses1991Physics,type PhysicsEngineVersion} from '../physics/engine-version.ts';
export function raceSnapshotSize(engine?:PhysicsEngineVersion){return uses1991Physics(engine)?1120:1072;}
export function raceCheckpointStorageBytes(rate:10|20,engine?:PhysicsEngineVersion){return 12000/(30*rate)*raceSnapshotSize(engine)+(uses1991Physics(engine)?48:0);}
/** Native canonical1072-byte state plus explicit MS91 body caches. This adapter
 * does not choose cache storage addresses or change checkpoint allocation.
 */
export function packVersionedRaceSnapshot(canonical:Uint8Array,engine:PhysicsEngineVersion,caches?:readonly [Uint8Array,Uint8Array]){
 if(canonical.length!==1072)throw Error('Canonical race snapshot must be1072 bytes');
 if(!uses1991Physics(engine))return Uint8Array.from(canonical);
 if(!caches||caches.some(c=>c.length!==24))throw Error('MS91 snapshot requires both24-byte body caches');
 const out=new Uint8Array(1120);out.set(canonical.subarray(0,338));
 for(let car=0;car<2;car++){
  const from=338+184*car,to=338+208*car;
  out.set(canonical.subarray(from,from+140),to);
  out.set(caches[car],to+140);
  out.set(canonical.subarray(from+140,from+184),to+164);
 }
 out.set(canonical.subarray(706),754);return out;
}
export function unpackVersionedRaceSnapshot(snapshot:Uint8Array,engine:PhysicsEngineVersion){
 if(!uses1991Physics(engine)){
  if(snapshot.length!==1072)throw Error('Legacy snapshot must be1072 bytes');
  return {canonical:Uint8Array.from(snapshot),caches:undefined};
 }
 if(snapshot.length!==1120)throw Error('MS91 snapshot must retain1120 bytes');
 const canonical=new Uint8Array(1072);canonical.set(snapshot.subarray(0,338));
 const caches:[Uint8Array,Uint8Array]=[new Uint8Array(24),new Uint8Array(24)];
 for(let car=0;car<2;car++){
  const from=338+208*car,to=338+184*car;
  canonical.set(snapshot.subarray(from,from+140),to);
  caches[car].set(snapshot.subarray(from+140,from+164));
  canonical.set(snapshot.subarray(from+164,from+208),to+140);
 }
 canonical.set(snapshot.subarray(754),706);return {canonical,caches};
}
