import assert from 'node:assert/strict';
import {initializeRaceSession} from '../lib/game/initialize-race-session.ts';
const d=0x20000,memory=Uint8Array.from({length:0x100000},(_,i)=>(i*17+3)&255),before=memory.slice(),tuning=new Uint8Array(776);
const lookup=()=>({midpoint:[0,0,0],first:[0,0,0],second:[0,0,0],alternate:0,side:0});
for(const rate of [10,20] as const)for(const mode of [-3,65533]){
 const setup={column:1,row:1,angle:0,hill:0 as const,transmission:0,mode,opponentSelected:0,opponentPath:[],framesPerSecond:rate};
 const modern=initializeRaceSession(memory,d,tuning,tuning,{...setup,physicsEngine:'ms-1991'},lookup);
 assert.deepEqual(modern.memory,before,'Cadence-only initialization preserves every retained byte');
 const legacy=initializeRaceSession(memory,d,tuning,tuning,{...setup,physicsEngine:'ms-1990'},lookup);
 assert.deepEqual(legacy,initializeRaceSession(memory,d,tuning,tuning,setup,lookup));
 assert.notDeepEqual(legacy.memory,before,'Legacy keeps its existing full initialization behavior');
}
assert.deepEqual(memory,before);
console.log(JSON.stringify({modeAndRateCases:4,modernStatePreserved:true,legacyDefaultsPreserved:true,pass:true}));
