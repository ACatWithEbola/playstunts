// Public replay metadata may come from a ranked score or a recent accepted
// attempt. Keep history-only recordings bounded by the existing five-run cap.
export const replayScoresSQL=`SELECT id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment FROM global_scores UNION ALL SELECT id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment FROM run_history h WHERE NOT EXISTS (SELECT 1 FROM global_scores s WHERE s.id=h.id)`;
export const pruneSharedReplaysSQL=`DELETE FROM shared_replays WHERE id NOT IN (SELECT id FROM global_scores UNION SELECT id FROM run_history)`;
