import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tickOriginalRaceTimer} from '../lib/game/native-race-timer.ts';
const fields:Record<string,[number,number]>={guard:[0x8936,1],audioElapsed:[0x8a46,2],audioRead:[0x9332,2],audioWrite:[0x8ffc,2],done:[0x8ff4,1],prompt:[0xaa77,1],exiting:[0x9aca,1],mode:[0xa3c2,1],counter:[0x8c1e,2],timer:[0x8c20,2],countdown:[0x90a0,1],renderTicks:[0xaa78,2],speed:[0x8ffe,1],slowToggle:[0x9b43,1]};
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,256);
for(const row of rows){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),events:unknown[]=[];
 for(const [name,[at,size]] of Object.entries(fields)){if(size===1)memory[at]=row.before[name];else v.setUint16(at,row.before[name],true);}
 tickOriginalRaceTimer({memory:()=>memory,stackMatches:()=>row.stackMatches,audioSample(record,interval){events.push({kind:'sample',record,interval});},pauseAudio(){events.push({kind:'pause'});},capture(){events.push({kind:'capture'});}},0,row.rate);
 const after=Object.fromEntries(Object.entries(fields).map(([name,[at,size]])=>[name,size===1?memory[at]:v.getUint16(at,true)]));
 assert.deepEqual(after,row.after,'Timer state '+JSON.stringify(row.before));assert.deepEqual(events,row.events);
}
console.log(JSON.stringify({originalTimerCases:256,stateAndCallbackOrderMatch:true,hardwareAudioNotVerified:true,pass:true}));
