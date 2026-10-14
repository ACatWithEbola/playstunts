import assert from 'node:assert/strict';
import {handleNativeRecordingFull} from '../lib/game/native-recording-full.ts';
for(const failure of ['pause','dialog','resume-audio','counter','resume-input']){
 const calls:string[]=[],state={pending:1,done:0};
 const invoke=(name:string)=>{calls.push(name);if(name===failure)throw Error('Injected '+name);};
 await assert.rejects(()=>handleNativeRecordingFull({suspendInput(){invoke('suspend');},pauseAudio(){invoke('pause');},resumeAudio(){invoke('resume-audio');},resetCounter(){invoke('counter');},resumeInput(){invoke('resume-input');},async dialog(){invoke('dialog');return 0;},raceEvent(){throw Error('Failed dialog must not select replay');}},state),new RegExp('Injected '+failure));
 assert.equal(calls.at(-1),'resume-input');assert.ok(calls.includes('counter'));assert.ok(calls.includes('resume-audio'));
 assert.deepEqual(state,{pending:1,done:0},'Failed prompt remains pending without fabricating a selection');
 // An explicitly retried prompt can complete after the host recovers.
 await handleNativeRecordingFull({suspendInput(){},pauseAudio(){},resumeAudio(){},resetCounter(){},resumeInput(){},async dialog(){return 0;},raceEvent(){throw Error('Continue must not select replay');}},state);
 assert.deepEqual(state,{pending:0,done:0});
}
console.log('Replay-buffer warning failures restore audio/counter/input and retain pending state for recovery');
