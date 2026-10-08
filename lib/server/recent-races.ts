import {scoreString} from '../game/global-score-format.ts';
import {publicScoreName} from '../game/public-score-name.ts';
export const recentRacesSQL=`WITH available AS (
 SELECT id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment FROM run_history
 UNION ALL
 SELECT id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment FROM global_scores WHERE id NOT IN (SELECT id FROM run_history)
), visible AS (SELECT * FROM available WHERE rules=? AND track_hash NOT IN (SELECT value FROM json_each(?)))
SELECT a.*,
 (SELECT MIN(b.ticks) FROM visible b WHERE b.track_hash=a.track_hash AND b.driver_key=a.driver_key AND b.car_code=a.car_code AND b.route_assessment=a.route_assessment AND b.created_at<a.created_at) AS previous_best,
 (SELECT MIN(b.ticks) FROM visible b WHERE b.track_hash=a.track_hash AND b.route_assessment='full_route' AND b.created_at<a.created_at) AS previous_record,
 (SELECT MIN(b.ticks) FROM visible b WHERE b.track_hash=a.track_hash AND b.route_assessment='full_route') AS current_record,
 COALESCE((SELECT name FROM shared_tracks t WHERE t.hash=a.track_hash),(SELECT name FROM score_tracks t WHERE t.hash=a.track_hash)) AS track_name
FROM visible a ORDER BY a.created_at DESC,a.id DESC LIMIT 5`;
export type RecentRaceRow={id:string;track_hash:string;car_code:string;ticks:number;record:string;created_at:number;driver_key:string;route_assessment:string;previous_best:number|null;previous_record:number|null;current_record:number|null;track_name:string|null};
export function recentRace(row:RecentRaceRow){
 const record=JSON.parse(row.record) as number[],valid=row.route_assessment==='full_route';
 // Only announce an improvement when an older comparable run supplies evidence.
 // Legacy/pruned history and simultaneous submissions get a neutral message.
 const event=valid&&row.previous_record!==null&&row.ticks<row.previous_record&&row.ticks===row.current_record?'record':row.driver_key&&!row.driver_key.startsWith('anonymous:')&&row.previous_best!==null&&row.ticks<row.previous_best?'improved':valid?'valid':'submitted';
 return {id:row.id,driver:publicScoreName(scoreString(record,0,17))||'—',track:publicScoreName(row.track_name??'Track '+row.track_hash.slice(0,8).toUpperCase()),car:publicScoreName(scoreString(record,17,41))||row.car_code,ticks:row.ticks,postedAt:row.created_at,event,improvement:event==='improved'?row.previous_best!-row.ticks:null};
}
