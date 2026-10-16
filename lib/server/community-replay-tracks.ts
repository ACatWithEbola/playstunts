import {replayScoresSQL} from './shared-replay-retention.ts';

// Only retained, accepted public recordings contribute tracks. Private saves,
// pending submissions and orphan recordings never enter the public catalogue.
// Derive historical tracks too, without rewriting any score or replay rows.
export const communityReplayTracksSQL=`SELECT s.track_hash AS hash,COALESCE(t.name,MIN(r.track_name)) AS name,MIN(r.created_at) AS created_at
 FROM shared_replays r JOIN (${replayScoresSQL}) s ON s.id=r.id
 LEFT JOIN score_tracks t ON t.hash=s.track_hash WHERE s.rules=? GROUP BY s.track_hash`;
export const communityTrackCatalogueSQL=`SELECT hash,name,created_at FROM shared_tracks
 UNION ALL SELECT p.hash,p.name,p.created_at FROM (${communityReplayTracksSQL}) p
 WHERE NOT EXISTS (SELECT 1 FROM shared_tracks t WHERE t.hash=p.hash)`;
export const communityReplayTrackDownloadSQL=`SELECT COALESCE(t.name,r.track_name) AS name,r.replay FROM shared_replays r
 JOIN (${replayScoresSQL}) s ON s.id=r.id LEFT JOIN score_tracks t ON t.hash=s.track_hash
 WHERE s.rules=? AND s.track_hash=? ORDER BY r.created_at,r.id LIMIT 1`;
