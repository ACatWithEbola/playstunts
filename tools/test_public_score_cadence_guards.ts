/** Both client gates and server boundary must reject unsupported timing. */
import assert from 'node:assert/strict';
import {completedScoreProof} from '../lib/game/completed-score-offer.ts';
import type {GlobalScoreContext} from '../lib/game/global-score-file-store.ts';
import {validateScoreSubmission,GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const record=Array(52).fill(0);record[50]=1;
const valid={record,replay:Array(0x723).fill(0),continued:false,flags:1,rules:GLOBAL_SCORE_RULES};
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 assert.equal(validateScoreSubmission({...valid,physicsEngine}).physicsEngine,physicsEngine);
 assert.equal(validateScoreSubmission({...valid,physicsEngine,framesPerSecond:20}).physicsEngine,physicsEngine);
 for(const framesPerSecond of [10,0,15,30,'20',null])assert.throws(()=>validateScoreSubmission({...valid,physicsEngine,framesPerSecond}));
 for(const [historyRate,sessionRate] of [[10,20],[20,10],[10,10],[undefined,10],[10,undefined]] as const){
  let writes=0;
  const context={state:{panel:{flags:1,playerTime:1}},history:{physicsEngine,framesPerSecond:historyRate,continued:false,inputs:[1]},runtime:{session:{framesPerSecond:sessionRate,async saveReplay(){writes++;throw Error('Unsupported proof must never reach save');}}}} as unknown as GlobalScoreContext;
  assert.equal(await completedScoreProof(context,1),undefined);
  assert.equal(writes,0,'Reject timing before canonicalizing or saving a proof');
 }
}
console.log('Public score timing guards: both history/session10Hz reject before save; server rejects unsupported cadence, omitted legacy/explicit20Hz identities retained');
