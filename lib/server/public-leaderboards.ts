import {scoreString} from '../game/global-score-format.ts';
import {publicScoreName} from '../game/public-score-name.ts';
import {driverKey} from './leaderboard-ranking.ts';
import type {RouteAssessment} from './shortcut-assessment.ts';
export type LeaderboardScore={id:string;driver:string;car:string;carCode:string;ticks:number;opponent:string;opponentAhead:boolean;postedAt:number;replay:boolean;routeAssessment?:RouteAssessment};
export type RankingGroup={scores:LeaderboardScore[];cars:{code:string;name:string;scores:LeaderboardScore[]}[]};
export type Leaderboard={hash:string;name:string;updatedAt:number;scores:LeaderboardScore[];cars:{code:string;name:string;scores:LeaderboardScore[]}[];categories?:Record<RouteAssessment,RankingGroup>};
export type PublicScoreRow={id:string;track_hash:string;car_code:string;ticks:number;record:string;created_at:number;track_name:string|null;has_replay:number;route_assessment?:string};
export function publicLeaderboards(rows:PublicScoreRow[],bundled:Map<string,string>){
 const boards=new Map<string,Leaderboard>(),keys=new Map<string,string>();
 for(const row of rows){let board=boards.get(row.track_hash);if(!board){board={hash:row.track_hash,name:publicScoreName(bundled.get(row.track_hash)??row.track_name??'Track '+row.track_hash.slice(0,8).toUpperCase()),updatedAt:row.created_at,scores:[],cars:[]};boards.set(row.track_hash,board);}
  const record=JSON.parse(row.record) as number[];keys.set(row.id,driverKey(record,row.id));board.updatedAt=Math.max(board.updatedAt,row.created_at);
  board.scores.push({id:row.id,driver:publicScoreName(scoreString(record,0,17)),car:scoreString(record,17,41)||row.car_code,carCode:row.car_code,ticks:row.ticks,opponent:scoreString(record,42,50).trim(),opponentAhead:record[41]===1,postedAt:row.created_at,replay:!!row.has_replay,routeAssessment:row.route_assessment==='shortcuts_detected'?'shortcuts_detected':row.route_assessment==='full_route'?'full_route':'not_assessed'});
 }
 const unique=(scores:LeaderboardScore[])=>{const seen=new Set<string>();return scores.filter(score=>{const key=keys.get(score.id)!;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,7);};
 for(const board of boards.values()){
  board.scores.sort((a,b)=>a.ticks-b.ticks||a.postedAt-b.postedAt||a.id.localeCompare(b.id));
  const group=(scores:LeaderboardScore[]):RankingGroup=>{const cars=new Map<string,LeaderboardScore[]>();for(const score of scores){const list=cars.get(score.carCode)??[];list.push(score);cars.set(score.carCode,list);}return {scores:unique(scores),cars:[...cars].map(([code,scores])=>({code,name:scores[0].car,scores:unique(scores)})).sort((a,b)=>a.name.localeCompare(b.name))};};
  board.categories={full_route:group(board.scores.filter(score=>score.routeAssessment==='full_route')),shortcuts_detected:group(board.scores.filter(score=>score.routeAssessment==='shortcuts_detected')),not_assessed:group(board.scores.filter(score=>score.routeAssessment==='not_assessed'))};
  board.cars=group(board.scores).cars;
  board.scores=unique(board.scores);
 }
 return [...boards.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.name.localeCompare(b.name));
}
