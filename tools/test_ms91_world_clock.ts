import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {drawOriginalWorldStatus} from '../lib/game/world-status-overlay.ts';
const path=process.argv[2];assert.ok(path,'Provide original10Hz replay');
const original=readFileSync(path),decoded=decodeVersionedReplay(original,'ms-1991');
assert.equal(decoded.framesPerSecond,10);
const race=await createNativeReplayRaceSession({...fixtureData,physicsEngine:'ms-1991',experimental10Hz:true},
 {configuration:Array.from(decoded.bytes.slice(0,24)),track:Array.from(decoded.bytes.slice(24,0x722)),name:'CLOCK',camera:0,graphics:2,soundEnabled:false},
 {bytes:decoded.bytes,name:'CLOCK',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:10},{resetMouse(){},async key(){return 27;}});
race.session.seek(0);race.session.seek(600);
const source=race.session.state.memory,before=source.slice(),d=0x2d1a0;
function clock(engine:'ms-1990'|'ms-1991',rate:10|20){
 const memory=source.slice(),v=new DataView(memory.buffer);
 // A controlled overlay frame isolates formatting from timer scheduling.
 memory[d+0xa3c2]=0;memory[d+0x8eab]=1;memory[d+0xa42a]=1;memory[d+0x12f]=1;
 v.setUint16(d+0xa034,0,true);v.setUint16(d+0x73b2,600,true);
 const text:string[]=[];
 drawOriginalWorldStatus(memory,d,0xeedc,{physicsEngine:engine,framesPerSecond:rate,
  shadowText(pointer){let value='';for(let i=0;i<100&&memory[d+pointer+i];i++)value+=String.fromCharCode(memory[d+pointer+i]);text.push(value);return 0xa78e;},indexedSprite(){}});
 return text[0];
}
assert.equal(clock('ms-1991',10),' 1:00');
assert.equal(clock('ms-1991',20),' 0:30');
assert.equal(clock('ms-1990',20),' 0:30');
assert.deepEqual(source,before);assert.deepEqual(readFileSync(path),original);
console.log('Allocated world-clock overlay formats600 ticks as1:00 at10Hz and0:30 at20Hz; source state/replay unchanged');
