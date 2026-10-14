import assert from 'node:assert/strict';
import {presentOriginalReplayBar,type OriginalReplayBarHost} from '../lib/game/replay-bar-presentation.ts';
function run(metadata:Pick<OriginalReplayBarHost,'physicsEngine'|'framesPerSecond'>={}){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),times:string[]=[];
 v.setUint16(0x8fd8,700,true);v.setUint16(0xa034,0,true);memory[0x31e9]=255;
 presentOriginalReplayBar(memory,0,0,650,{...metadata,sprite(){},time(text){times.push(text);},fill(){},outline(){}});
 return {memory,times};
}
assert.deepEqual(run(),run({physicsEngine:'ms-1990',framesPerSecond:20}));
assert.deepEqual(run(),run({physicsEngine:'ms-1991',framesPerSecond:20}));
const slow=run({physicsEngine:'ms-1991',framesPerSecond:10});
assert.deepEqual(slow.times,[' 1:10.00',' 1:05.00']);
assert.deepEqual(slow.memory,run().memory,'Formatting must not change replay controls or cache values');
console.log('Replay bar formats explicitMS91 cadence; default text and control/cache memory unchanged');
