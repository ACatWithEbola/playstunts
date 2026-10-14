import assert from 'node:assert/strict';
import {waitForNativeOpponent} from '../lib/game/native-opponent-wait.ts';
import {originalOpponentWaitContinues} from '../lib/game/race-completion-flow.ts';
async function run(fps?:10|20,escape=false){
 const rate=fps??20,memory=new Uint8Array(65536),v=new DataView(memory.buffer);
 memory[0x8fc8]=1;v.setUint16(0x8c26,1500*rate-1,true);
 const phases:number[]=[],times:string[]=[];let captures=0;
 await waitForNativeOpponent({memory:()=>memory,async show(){},captureInput(){captures++;},simulate(phase){phases.push(phase);v.setUint16(0x8c26,v.getUint16(0x8c26,true)+1,true);},drawTime(text){times.push(text);},async key(){return escape?27:0;}},0,fps,fps===10?'ms-1991':undefined);
 return {memory,phases,times,captures};
}
assert.deepEqual(await run(),await run(20));
for(const rate of [10,20] as const){
 const result=await run(rate);
 assert.equal(result.captures,1);assert.deepEqual(result.phases,[rate-1]);
 assert.deepEqual(result.times,['25:00.00']);assert.equal(result.memory[0xa34e],0);
 assert.equal(originalOpponentWaitContinues(0,0,1500*rate-1,0,rate),true);
 assert.equal(originalOpponentWaitContinues(0,0,1500*rate,0,rate),false);
 assert.equal(originalOpponentWaitContinues(0,0,1500*rate+1,0,rate),true,'Original stop is equality, not a bound');
 assert.equal(originalOpponentWaitContinues(27,0,1,0,rate),false);
 assert.equal((await run(rate,true)).memory[0xa34e],0);
}
console.log('Opponent wait cadence, first redraw, equality limit and Escape cleanup pass; default20 unchanged');
