import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {categoryCarScoresSQL,pruneCarScoresSQL} from './leaderboard-ranking.ts';
import {pruneRunHistorySQL} from './run-history.ts';
import {pruneSharedReplaysSQL} from './shared-replay-retention.ts';
import {replaceRetentionSQL as replace} from './retention-sql-replacement.ts';

/** Closed enum only; never interpolate a request string into SQL. Missing
 * metadata is legacy. Scope both ranking candidates and deletion targets. */
export function engineScopedRetention(engine:PhysicsEngineVersion){
 const version=resolvePhysicsEngine(engine);
 const matches=(id:string)=>`COALESCE((SELECT physics_engine FROM race_engines e WHERE e.id=${id}),'ms-1990')='${version}'`;
 const category=replace(categoryCarScoresSQL,'FROM global_scores s',`FROM global_scores s WHERE ${matches('s.id')}`);
 return {
  car:replace(replace(pruneCarScoresSQL,'AND id NOT IN',`AND ${matches('global_scores.id')} AND id NOT IN`),categoryCarScoresSQL,category),
  history:replace(replace(pruneRunHistorySQL,'AND id NOT IN',`AND ${matches('run_history.id')} AND id NOT IN`),'WHERE rules=? AND track_hash=?)',`WHERE rules=? AND track_hash=? AND ${matches('run_history.id')})`),
  shared:replace(pruneSharedReplaysSQL,'WHERE id NOT IN',`WHERE ${matches('shared_replays.id')} AND id NOT IN`),
 };
}
