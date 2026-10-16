type RecentRun={id:string;postedAt:number};
type PendingRun=RecentRun&{verifiedId:string|null};
/** One newest-first feed and one shared limit, not seven of each status. */
export function recentRaceFeed<R extends RecentRun,P extends PendingRun>(races:readonly R[],pending:readonly P[]){
 const verifiedIds=new Set(races.map(race=>race.id));
 const entries=[...races.map(race=>({kind:'verified' as const,run:race})),...pending
  .filter(run=>!verifiedIds.has(run.verifiedId??run.id))
  .map(run=>({kind:'pending' as const,run}))];
 const seen=new Set<string>();
 return entries.sort((a,b)=>b.run.postedAt-a.run.postedAt||a.run.id.localeCompare(b.run.id))
  .filter(entry=>{if(seen.has(entry.run.id))return false;seen.add(entry.run.id);return true;}).slice(0,7);
}
