import {LEGACY_PHYSICS,resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Verify retained identity before acceptance/reassessment writes. Missing tags
 * on retained rows identify legacy; only genuinely new modern IDs may add one. */
export async function assertRaceEngineIdentity(db:Pick<D1Database,'prepare'>,id:string,engine:PhysicsEngineVersion){
 const version=resolvePhysicsEngine(engine);
 const row=await db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').bind(id).first<{physics_engine:string}>();
 if(row){
  if(resolvePhysicsEngine(row.physics_engine)!==version)throw Error('Stored engine identity conflicts with submitted proof');
  return;
 }
 if(version!==LEGACY_PHYSICS){
  const retained=await db.prepare('SELECT id FROM global_scores WHERE id=? UNION ALL SELECT id FROM accepted_scores WHERE id=? UNION ALL SELECT id FROM run_history WHERE id=? UNION ALL SELECT id FROM shared_replays WHERE id=? LIMIT 1').bind(id,id,id,id).first<{id:string}>();
  if(retained)throw Error('Stored engine identity is missing for a retained nonlegacy proof');
 }
}
/** Include in the acceptance transaction. Never UPDATE a prior engine identity. */
export function raceEngineStatements(db:Pick<D1Database,'prepare'>,id:string,engine:PhysicsEngineVersion){
 const version=resolvePhysicsEngine(engine);
 return version===LEGACY_PHYSICS?[]:[db.prepare('INSERT OR IGNORE INTO race_engines(id,physics_engine) VALUES (?,?)').bind(id,version)];
}
export async function readRaceEngine(db:Pick<D1Database,'prepare'>,id:string):Promise<PhysicsEngineVersion>{
 const row=await db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').bind(id).first<{physics_engine:string}>();
 return resolvePhysicsEngine(row?.physics_engine);
}
