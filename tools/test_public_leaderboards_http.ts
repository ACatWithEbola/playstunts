import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishedScoreFixture} from './global-score-fixture.ts';
import {GLOBAL_SCORE_RULES,scoreHash} from '../lib/game/global-score-format.ts';
const origin=process.argv[2]??'http://localhost:3002';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('This test writes isolated local scores only');
test('new verified scores appear immediately with track labels and censored names',async()=>{
 const base=await finishedScoreFixture();
 for(const [horizon,name,driver] of [[1,'SUNSET','LOCAL DRIVER'],[2,'ALPINE','F.U.C.K']] as const){
  const proof={...base,replay:[...base.replay],record:[...base.record]};proof.replay[0x721]=horizon+64;proof.replay.fill(0,13,22);Array.from(name,c=>c.charCodeAt(0)).forEach((n,i)=>proof.replay[13+i]=n);proof.record.fill(0,0,17);Array.from(driver,c=>c.charCodeAt(0)).forEach((n,i)=>proof.record[i]=n);
  const response=await fetch(origin+'/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify(proof)});assert.equal(response.status,200,await response.clone().text());
  const hash=await scoreHash(Uint8Array.from(proof.replay.slice(24,0x722))),directory=await fetch(origin+'/api/leaderboards').then(r=>r.json() as Promise<{boards:{hash:string;name:string;scores:{driver:string;car:string;ticks:number}[]}[]}>),board=directory.boards.find(b=>b.hash===hash)!;
  assert.ok(board);assert.equal(board.name,name);assert.ok(board.scores.some(score=>score.driver===(driver==='F.U.C.K'?'••••':driver)));assert.ok(board.scores.every(score=>score.car&&score.ticks>0));
  if(driver==='F.U.C.K'){const game=await fetch(origin+'/api/highscores?track='+hash).then(r=>r.json() as Promise<{file:number[]}>);assert.ok(String.fromCharCode(...game.file).includes('****'));assert.ok(!String.fromCharCode(...game.file).includes(driver));}
 }
});
