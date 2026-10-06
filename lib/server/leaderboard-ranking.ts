import {scoreString} from '../game/global-score-format.ts';

/** Names are not accounts. Fold ASCII case/spaces, never the censored label.
 * An unnamed run has no reliable identity: do not merge unrelated guests. */
export function driverKey(record:ArrayLike<number>,id:string){
 const name=scoreString(record,0,17).replace(/^ +| +$/g,'').replace(/[A-Z]/g,c=>c.toLowerCase());
 return name?'name:'+name:'anonymous:'+id;
}
// Historical rows have the constant empty default. Resolve their raw name at
// read time, without a data backfill or changing historical proof bytes.
const legacyNameSQL="trim(substr(char(json_extract(s.record,'$[0]'),json_extract(s.record,'$[1]'),json_extract(s.record,'$[2]'),json_extract(s.record,'$[3]'),json_extract(s.record,'$[4]'),json_extract(s.record,'$[5]'),json_extract(s.record,'$[6]'),json_extract(s.record,'$[7]'),json_extract(s.record,'$[8]'),json_extract(s.record,'$[9]'),json_extract(s.record,'$[10]'),json_extract(s.record,'$[11]'),json_extract(s.record,'$[12]'),json_extract(s.record,'$[13]'),json_extract(s.record,'$[14]'),json_extract(s.record,'$[15]'),json_extract(s.record,'$[16]')),1,instr(char(json_extract(s.record,'$[0]'),json_extract(s.record,'$[1]'),json_extract(s.record,'$[2]'),json_extract(s.record,'$[3]'),json_extract(s.record,'$[4]'),json_extract(s.record,'$[5]'),json_extract(s.record,'$[6]'),json_extract(s.record,'$[7]'),json_extract(s.record,'$[8]'),json_extract(s.record,'$[9]'),json_extract(s.record,'$[10]'),json_extract(s.record,'$[11]'),json_extract(s.record,'$[12]'),json_extract(s.record,'$[13]'),json_extract(s.record,'$[14]'),json_extract(s.record,'$[15]'),json_extract(s.record,'$[16]')),char(0))-1))";
const resolvedDriverSQL=`CASE WHEN s.driver_key<>'' THEN s.driver_key WHEN ${legacyNameSQL}='' THEN 'anonymous:'||s.id ELSE 'name:'||lower(${legacyNameSQL}) END`;
export const rankedScoresSQL=`SELECT s.*, ROW_NUMBER() OVER (
 PARTITION BY rules,track_hash,${resolvedDriverSQL} ORDER BY ticks,created_at,id
) AS driver_rank FROM global_scores s`;
export const bestCarScoresSQL=`SELECT s.*, ROW_NUMBER() OVER (
 PARTITION BY rules,track_hash,car_code,${resolvedDriverSQL} ORDER BY ticks,created_at,id
) AS driver_rank FROM global_scores s`;
export const categoryCarScoresSQL=`SELECT s.*, ROW_NUMBER() OVER (
 PARTITION BY rules,track_hash,car_code,route_assessment,${resolvedDriverSQL} ORDER BY ticks,created_at,id
) AS driver_rank FROM global_scores s`;
export const categoryScoresSQL=`SELECT s.*, ROW_NUMBER() OVER (
 PARTITION BY rules,track_hash,route_assessment,${resolvedDriverSQL} ORDER BY ticks,created_at,id
) AS driver_rank FROM global_scores s`;
export const currentCarScoresSQL=`SELECT * FROM (SELECT s.*, ROW_NUMBER() OVER (
 PARTITION BY rules,track_hash,car_code,route_assessment ORDER BY ticks,created_at,id
) AS car_rank FROM (${categoryCarScoresSQL}) s WHERE driver_rank=1) WHERE car_rank<=7`;
/** Run inside the same atomic batch as insertion, including replay cleanup. */
export const pruneCarScoresSQL=`DELETE FROM global_scores WHERE rules=? AND track_hash=? AND id NOT IN (
 SELECT id FROM (SELECT id,ROW_NUMBER() OVER (PARTITION BY car_code,route_assessment ORDER BY ticks,created_at,id) AS car_rank
 FROM (${categoryCarScoresSQL}) WHERE rules=? AND track_hash=? AND driver_rank=1) WHERE car_rank<=7
)`;
/** Preserve server acceptance before pruning; arbitrary replay uploads have no receipt. */
export const retainAcceptedScoresSQL='INSERT OR IGNORE INTO accepted_scores(id,rules,created_at) SELECT id,rules,created_at FROM global_scores WHERE rules=? AND track_hash=?';
