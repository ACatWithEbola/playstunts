import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
export function engineScorePredicate(engine:PhysicsEngineVersion,alias='s'){
 if(!/^[a-z][a-z0-9_]*$/i.test(alias))throw Error('Invalid score alias');
 const version=resolvePhysicsEngine(engine);
 return `COALESCE((SELECT physics_engine FROM race_engines e WHERE e.id=${alias}.id),'ms-1990')='${version}'`;
}
/** Filter before window ranking, not afterward: otherwise a faster recording
 * from another engine hides the requested engine's driver's best result. */
export function engineScopedRanking(sql:string,engine:PhysicsEngineVersion){
 const version=resolvePhysicsEngine(engine);
 const source='FROM global_scores s';
 if(!sql.includes(source))throw Error('Unsupported leaderboard query shape');
 return sql.replaceAll(source,`${source} WHERE ${engineScorePredicate(version)}`);
}
