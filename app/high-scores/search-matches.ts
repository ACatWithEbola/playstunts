import type {Leaderboard,LeaderboardScore} from '../../lib/server/public-leaderboards.ts';
export function scoreMatches(score:LeaderboardScore,query:string){
 const term=query.trim().toLowerCase();
 return !!term&&[score.driver,score.car,score.carCode].some(value=>value.toLowerCase().includes(term));
}
export function searchRanking(board:Leaderboard,query:string){
 if(!query.trim())return null;
 for(const category of ['full_route','shortcuts_detected'] as const){
  const group=board.categories?.[category];
  if(!group)continue;
  if(group.scores.some(score=>scoreMatches(score,query)))return {category,mode:'overall' as const,code:''};
  const car=group.cars.find(car=>car.scores.some(score=>scoreMatches(score,query)));
  if(car)return {category,mode:'car' as const,code:car.code};
 }
 return null;
}
export function searchVisible(scores:LeaderboardScore[],query:string){
 return scores.reduce((count,score,index)=>scoreMatches(score,query)?Math.max(count,index+1):count,10);
}
