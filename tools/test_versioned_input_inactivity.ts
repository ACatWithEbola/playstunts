import assert from 'node:assert/strict';
import {selectOriginalRaceInput} from '../lib/game/race-input-selection.ts';
let cases=0;
for(const engine of ['ms-1990','ms-1991'] as const)for(const rate of [10,20] as const)for(const frame of [39,40,41,79,80,81,65535])for(const enabled of [0,1])for(const phase of [0,1]){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer);
 memory[0xa42a]=enabled;memory[0x7fee]=phase;v.setUint16(0x8c26,frame,true);
 let crashes=0;
 const host={memory:()=>memory,pauseAudio(){throw Error('Unexpected pause');},crash(cause:number,car:number){assert.equal(cause,1);assert.equal(car,0);crashes++;},mouse(){throw Error('Unexpected mouse');},joystickSteering:()=>0,controls:()=>0,keyDown:()=>0};
 assert.equal(selectOriginalRaceInput(host,0,0,rate,engine),0);
 assert.equal(crashes,Number(!enabled&&!phase&&frame>(engine==='ms-1991'?4*rate:80)));
 if(engine==='ms-1990'){crashes=0;assert.equal(selectOriginalRaceInput(host,0,0,rate),0);assert.equal(crashes,Number(!enabled&&!phase&&frame>80));}
 cases++;
}
console.log(JSON.stringify({inactivityCases:cases,legacyDefaultPreserved:true,pass:true}));
