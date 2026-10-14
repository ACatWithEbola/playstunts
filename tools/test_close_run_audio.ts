import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {closeRunAudio} from '../lib/game/close-run-audio.ts';
const names=['stop music','close music','close timed transport','close output','close power','close context'];
for(let failAt=-1;failAt<names.length;failAt++){
 const calls:string[]=[],error=Error('Failure at '+failAt);
 const pending=closeRunAudio(names.map((name,index)=>async()=>{await Promise.resolve();calls.push(name);if(index===failAt)throw error;}));
 if(failAt<0)await pending;else await assert.rejects(pending,value=>value===error);
 assert.deepEqual(calls,names,'A failed earlier release cannot skip later resources');
}
const first=Error('First'),later=Error('Later');let last=false;
await assert.rejects(closeRunAudio([()=>{throw first;},async()=>{throw later;},()=>{last=true;}]),error=>error===first);
assert.equal(last,true);
await assert.rejects(closeRunAudio([()=>Promise.reject(undefined)]),error=>error===undefined);
const source=readFileSync(new URL('../app/OpeningSequence.tsx',import.meta.url),'utf8');
const expression=source.match(/const releaseAudio=([^\n]+);/)?.[1];assert.ok(expression);
const calls:string[]=[],failure=Error('Music stop failed');
const make=new Function('closeRunAudio','music','timedRoland','roland','timedPower','rolandPower','runAudio',`let audioRelease;return (${expression});`);
const release=make(closeRunAudio,{async stopAsync(){calls.push(names[0]);throw failure;},close(){calls.push(names[1]);}},
 {async closeAsync(){calls.push(names[2]);}},{output:{close(){calls.push(names[3]);}}},
 {close(){calls.push(names[4]);}},undefined,{async close(){calls.push(names[5]);}});
await assert.rejects(release(),error=>error===failure);assert.deepEqual(calls,names,'OpeningSequence must close every run audio owner after failed Stop');
await assert.rejects(release(),error=>error===failure);assert.deepEqual(calls,names,'Repeated cleanup awaits the same release without closing twice');
const ordered:string[]=[];let finishStop!:()=>void;
const sharedPower={close(){assert.fail('A run must not close externally owned Roland power');}};
const waiting=make(closeRunAudio,{async stopAsync(){ordered.push('stop');await new Promise<void>(resolve=>{finishStop=resolve;});},close(){ordered.push('music');}},
 {async closeAsync(){ordered.push('timed');}},{output:{close(){ordered.push('output');}}},sharedPower,sharedPower,{async close(){ordered.push('context');}});
const pending=waiting(),same=waiting();assert.equal(pending,same,'Concurrent cleanup must share its exact pending promise');
assert.deepEqual(ordered,['stop'],'Dependent resources remain owned until Stop settles');
finishStop();await pending;await same;
assert.deepEqual(ordered,['stop','music','timed','output','context']);
console.log('Run audio cleanup attempts every ordered resource after sync/async failures and retains the first error');
