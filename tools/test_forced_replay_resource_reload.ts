import assert from 'node:assert/strict';
import {loadNativeReplay} from '../lib/game/native-replay-load.ts';
for(const forced of [false,true])for(const opponent of [0,1]){
 const d=0x20000,memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),calls:string[]=[];
 v.setUint16(d+0x9358,0x6000,true);memory[d+0x8fc8]=opponent;
 const result=await loadNativeReplay({memory:()=>memory,pauseAudio(){calls.push('pause');},async selectReplay(){return 1;},prepareLoad(){calls.push('waiting');},async readReplay(){calls.push('read');return 0;},analyzeTrack(){calls.push('analyze');},refreshOpponent(){calls.push('refresh');},releaseCarResources(){calls.push('release');},loadCarResources(){calls.push('load');},initialize(mode){assert.equal(mode,-1);calls.push('initialize');},forceReloadCarResources:()=>forced},d);
 assert.equal(result,true);
 assert.deepEqual(calls,['pause','waiting','read','analyze',...(forced?['release','load']:opponent?['refresh']:[]),'initialize']);
 assert.equal(memory[d+0x8018],0);
}
console.log('Forced checkpoint-growth reload rebuilds opponent once; ordinary retained reload sequencing stays unchanged');
