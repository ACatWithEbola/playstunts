import type {Leaderboard} from '../server/public-leaderboards.ts';
type PendingTrack={trackHash:string;track:string;driver:string;car:string;postedAt:number};
export function pendingTrackMatches(row:PendingTrack,query:string){const q=query.trim().toLowerCase();return !q||[row.trackHash,row.track,row.driver,row.car].some(value=>value.toLowerCase().includes(q));}
/** Pending claims create a visible track shell, never a ranked score or record. */
export function withPendingTracks(boards:Leaderboard[],pending:PendingTrack[],query:string){
 const result=[...boards],seen=new Set(boards.map(b=>b.hash));
 for(const row of pending){if(seen.has(row.trackHash)||!pendingTrackMatches(row,query))continue;seen.add(row.trackHash);result.unshift({hash:row.trackHash,name:row.track,updatedAt:row.postedAt,scores:[],cars:[],categories:{full_route:{scores:[],cars:[]},shortcuts_detected:{scores:[],cars:[]},not_assessed:{scores:[],cars:[]}}});}
 return result;
}
