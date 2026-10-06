import {scoreString} from '../game/global-score-format.ts';
import {publicScoreName} from '../game/public-score-name.ts';
export type LeaderboardScore={id:string;driver:string;car:string;carCode:string;ticks:number;opponent:string;opponentAhead:boolean;postedAt:number;replay:boolean};
export type Leaderboard={hash:string;name:string;updatedAt:number;scores:LeaderboardScore[]};
export type PublicScoreRow={id:string;track_hash:string;car_code:string;ticks:number;record:string;created_at:number;track_name:string|null;has_replay:number};
export function publicLeaderboards(rows:PublicScoreRow[],bundled:Map<string,string>){
 const boards=new Map<string,Leaderboard>();
 for(const row of rows){let board=boards.get(row.track_hash);if(!board){board={hash:row.track_hash,name:publicScoreName(bundled.get(row.track_hash)??row.track_name??'Track '+row.track_hash.slice(0,8).toUpperCase()),updatedAt:row.created_at,scores:[]};boards.set(row.track_hash,board);}
  const record=JSON.parse(row.record) as number[];board.updatedAt=Math.max(board.updatedAt,row.created_at);
  board.scores.push({id:row.id,driver:publicScoreName(scoreString(record,0,17)),car:scoreString(record,17,41)||row.car_code,carCode:row.car_code,ticks:row.ticks,opponent:scoreString(record,42,50).trim(),opponentAhead:record[41]===1,postedAt:row.created_at,replay:!!row.has_replay});
 }
 for(const board of boards.values())board.scores.sort((a,b)=>a.ticks-b.ticks||a.postedAt-b.postedAt||a.id.localeCompare(b.id));
 return [...boards.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.name.localeCompare(b.name));
}
