/** Read-only audit. Fetch an existing public score and replay, never submit it. */
import {fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const [trackName,id]=process.argv.slice(2);
if(!trackName||!id||!/^[a-f0-9]{64}$/.test(id))throw Error('Usage: node tools/check_public_replay_route.ts TRACK SCORE_ID');
const directory=await fetch('https://playstunts.com/api/leaderboards?q='+encodeURIComponent(trackName));
if(!directory.ok)throw Error('Leaderboard unavailable');
const {boards}=await directory.json() as {boards:{cars:{scores:{id:string;driver:string;ticks:number}[]}[]}[]};
const score=boards.flatMap(b=>b.cars.flatMap(c=>c.scores)).find(s=>s.id===id);
if(!score)throw Error('Exact current score not found');
const response=await fetch('https://playstunts.com/api/replays?id='+id);
if(!response.ok)throw Error('Public replay unavailable');
const replay=new Uint8Array(await response.arrayBuffer()),record=Array(52).fill(0);
[...score.driver].forEach((c,i)=>record[i]=c.charCodeAt(0));record[50]=score.ticks&255;record[51]=score.ticks>>8;
const verified=await verifyGlobalScore({record,replay:Array.from(replay),rules:GLOBAL_SCORE_RULES,flags:1,continued:false},fixtureData);
if(verified.id!==id)throw Error('Canonical score mismatch; no association may be inferred');
console.log(JSON.stringify({id,driver:score.driver,ticks:verified.ticks,routeAssessment:verified.routeAssessment,evidence:verified.routeEvidence},null,2));
