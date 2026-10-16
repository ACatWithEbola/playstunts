import assert from 'node:assert/strict';
import {finishedScoreFixture} from './global-score-fixture.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const origin=process.argv[2]??'http://localhost:5191';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('QA submissions are local-only');
const engine=process.argv[3]==='ms-1991'?'ms-1991':'ms-1990',wait=Number(process.argv[4]??0),name=process.argv[5]??'QA_PENDING';
const reference=process.argv[6],ticks=Number(process.argv[7]);
const proof=reference?{record:Array(52).fill(0),replay:Array.from(decodeVersionedReplay(new Uint8Array(await(await fetch('https://playstunts.com/api/replays?id='+reference)).arrayBuffer()),engine).bytes),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:engine}:await finishedScoreFixture(wait,engine);
if(reference){proof.record[50]=ticks&255;proof.record[51]=ticks>>>8;}
proof.record.fill(0,0,17);proof.record.splice(0,name.length,...Array.from(name,c=>c.charCodeAt(0)));
const response=await fetch(origin+'/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES,'X-Stunts-Queue':'1'},body:JSON.stringify({...proof,publicReplayConsent:true})});
const queued=await response.json() as {submissionId:string;state:string;error?:string};assert.equal(response.status,202,JSON.stringify(queued));console.log(JSON.stringify({queued,engine,ticks:proof.record[50]|proof.record[51]<<8}));
const visible=await(await fetch(origin+'/api/score-submissions')).json() as {submissions:{id:string;state:string}[]};console.log(JSON.stringify({public:visible.submissions}));
