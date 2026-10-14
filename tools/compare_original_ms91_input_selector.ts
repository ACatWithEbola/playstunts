import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectOriginalRaceInput} from '../lib/game/race-input-selection.ts';
const fields:Record<string,[number,number]>={mode:[0xa3c2,1],count:[0x73b2,2],length:[0x8fd8,2],done:[0x8ff4,1],exiting:[0x9aca,1],evaluation:[0x8eac,1],enabled:[0xa42a,1],phase:[0x7fee,1],frame:[0x8c26,2],mouse:[0x12c,1],joystick:[0x4602,1],target:[0x5424,1],mouseX:[0xa77c,2],mouseY:[0xa7de,2],buttons:[0x893a,2]};
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,384);
for(const [index,row] of rows.entries()){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),events:unknown[]=[];
 for(const [name,[at,size]] of Object.entries(fields)){if(size===1)memory[at]=row.before[name];else v.setUint16(at,row.before[name],true);}
 for(let i=0;i<129;i++)memory[0x306c+i]=(i*3)&255;
 const selected=selectOriginalRaceInput({memory:()=>memory,pauseAudio(){events.push({kind:'pause'});},crash(){events.push({kind:'crash'});},mouse(){events.push({kind:'mouse'});return row.sample;},joystickSteering(){events.push({kind:'joystick'});return row.joystick;},controls(){events.push({kind:'controls'});return row.controls;},keyDown(scan){events.push({kind:'key',scan});return row.keys[String(scan)];}},0,row.forced,row.rate,'ms-1991');
 const after=Object.fromEntries(Object.entries(fields).map(([name,[at,size]])=>[name,size===1?memory[at]:v.getUint16(at,true)]));
 assert.equal(selected,row.selected,'Selected input case '+index);assert.deepEqual(after,row.after,'Selector state case '+index);assert.deepEqual(events,row.events,'Callback order case '+index);
 assert.deepEqual(Array.from(memory.subarray(0x88e4,0x88e4+64)),row.history,'Steering history case '+index);
 assert.deepEqual(Array.from(memory.subarray(0x893c,0x893c+64)),row.historyFlags);
}
console.log(JSON.stringify({originalSelectorCases:384,stateInputAndCallbacksMatch:true,pass:true}));
