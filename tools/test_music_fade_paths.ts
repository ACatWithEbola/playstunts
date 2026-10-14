import assert from 'node:assert/strict';
import {fadeOriginalMusic} from '../lib/game/fade-original-music.ts';
let cases=0;
for(const alternate of [0,1])for(let initial=0;initial<256;initial++)for(const duration of [2,65535,65536]){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),volumes:number[]=[],delays:number[]=[];
 memory[0x4e06]=alternate;memory[0x9f62]=initial;let stopCount=0;
 await fadeOriginalMusic({memory:()=>memory,musicVolume(value){assert.equal(v.getUint16(0x4e0c,true),1);volumes.push(value);},alternateCommand(command,data){assert.equal(command,4);assert.equal(data,0x4e08);volumes.push(memory[0x4e0b]);},beginDelay(ticks){assert.equal(v.getUint16(0x4e0c,true),0);delays.push(ticks);},async finishDelay(){},stopMusic(){stopCount++;}},0,duration);
 const expected:number[]=[];for(let value=alternate?100:initial;value>0;value-=2)expected.push(value);
 assert.deepEqual(volumes,alternate?[...expected,100]:expected);
 assert.deepEqual(delays,alternate?[...expected.map(()=>duration<<16>>16),50]:expected.map(()=>duration<<16>>16));
 assert.equal(stopCount,1);assert.equal(memory[0x9f62],initial);cases++;
}
console.log(`PASS: ${cases} native music fade cases; both driver paths, signed durations and final volume restore, no audio output`);
