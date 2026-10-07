import {resolvedDriverSQL} from './leaderboard-ranking.ts';
// Capture known accepted records before leaderboard pruning. No replay bytes.
export const retainRunHistorySQL=`INSERT OR IGNORE INTO run_history(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) SELECT s.id,s.rules,s.track_hash,s.car_code,s.ticks,s.record,s.created_at,${resolvedDriverSQL},s.route_assessment FROM global_scores s WHERE s.rules=? AND s.track_hash=?`;
export const pruneRunHistorySQL=`DELETE FROM run_history WHERE rules=? AND track_hash=? AND id NOT IN (SELECT id FROM (SELECT id,ROW_NUMBER() OVER (PARTITION BY driver_key ORDER BY created_at DESC,rowid DESC,id) AS history_rank FROM run_history WHERE rules=? AND track_hash=?) WHERE history_rank<=5)`;
