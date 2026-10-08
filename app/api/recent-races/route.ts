import {env} from 'cloudflare:workers';
import {GLOBAL_SCORE_RULES} from '@/lib/game/global-score-format';
import {withdrawnCommunityTracks} from '@/lib/server/withdrawn-community-tracks';
import {recentRacesSQL,recentRace,type RecentRaceRow} from '@/lib/server/recent-races';
export async function GET(){
 try{const {DB}=env as unknown as {DB:D1Database};const rows=await DB.prepare(recentRacesSQL).bind(GLOBAL_SCORE_RULES,JSON.stringify(withdrawnCommunityTracks)).all<RecentRaceRow>();
 return Response.json({races:rows.results.map(recentRace)},{headers:{'Cache-Control':'public, max-age=30','X-Content-Type-Options':'nosniff'}});
 }catch(error){console.error('Recent race activity unavailable',error);return Response.json({error:'Recent races are temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
