import assert from 'node:assert/strict';
import {initializeRaceSession} from '../lib/game/initialize-race-session.ts';
const d=0x20000,checkpoint=0x60000;
const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);
view.setUint16(d+0xa030,0,true);view.setUint16(d+0xa032,checkpoint/16,true);
for(let i=0;i<40;i++)memory[checkpoint+0x3c4+i*0x430]=1;
const before=memory.slice(),tuning=new Uint8Array(776);
const setup={column:1,row:1,angle:0,hill:0 as const,transmission:0,mode:-1,opponentSelected:0,opponentPath:[]};
const lookup=()=>({midpoint:[0,0,0],first:[0,0,0],second:[0,0,0],alternate:0,side:0});
const legacy=initializeRaceSession(memory,d,tuning,tuning,setup,lookup);
assert.deepEqual(legacy,initializeRaceSession(memory,d,tuning,tuning,{...setup,framesPerSecond:20},lookup));
const slow=initializeRaceSession(memory,d,tuning,tuning,{...setup,framesPerSecond:10},lookup);
for(let i=0;i<40;i++){
 assert.equal(legacy.memory[checkpoint+0x3c4+i*0x430],i<20?0:1);
 assert.equal(slow.memory[checkpoint+0x3c4+i*0x430],0);
}
assert.deepEqual(memory,before);
console.log('Race initialization resets all cadence-specific checkpoint slots without mutating input; default equals explicit20');
