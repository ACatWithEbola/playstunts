import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fadeTimedMt32Music} from '../lib/game/timed-mt32-music-fade.ts';
import {createControlledOriginalMt32Music} from '../lib/game/controlled-mt32-music.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
for(const generation of ['ms-1990','ms-1991'] as const)for(const score of ['titl','slct','vict','over']){
 const path=`public/game/mt32-music-${score}-seed.json`,source=readFileSync(path,'utf8'),music=createControlledOriginalMt32Music(versionedMt32MusicSeed(JSON.parse(source),generation));
 let clock=0,stopped=false;const volumes:number[]=[],delays:number[]=[],bytes:number[]=[];
 const transport=createMt32PitTransportHost({read:()=>0,write(port,value){if(port===0x330)bytes.push(value);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clock,async poll(){clock+=97;}});
 const host={async execute(program:Parameters<typeof executeTimedMt32Program>[0]){const at=bytes.length,result=await executeTimedMt32Program(program,transport);const packet=bytes.slice(at);assert.deepEqual(packet.slice(0,8),[0xf0,0x41,0x10,0x16,0x12,16,0,22]);assert.equal(packet.at(-1),0xf7);assert.equal(packet.length,11);assert.equal((packet.slice(5,-1).reduce((sum,value)=>sum+value,0)&127),0);volumes.push(packet[8]);return result;},async write(writes:number[][]){await executeTimedMt32Program(createMt32MusicWriteProgram(music.runtime.driver,writes,generation),transport);}};
 const observed:number[]= [];let synchronized=0,observedStop=false;
 await fadeTimedMt32Music(music,host,async ticks=>{delays.push(ticks);clock+=ticks*ORIGINAL_PIT_DIVISOR;if(!stopped)await music.tickTimed(host);},()=>{stopped=true;assert.equal(volumes.length,50,'Stop follows all fade packets');},()=>true,async()=>{synchronized++;},{volume(value){assert.equal(synchronized,observed.length+1,'Progress follows delivery synchronization');assert.equal(observedStop,false);observed.push(value);},stopped(){assert.equal(stopped,true);assert.equal(delays.length,50,'Stop notification precedes final silent wait');observedStop=true;}});
 assert.deepEqual(observed,Array.from({length:50},(_,index)=>100-index*2));assert.ok(observedStop,'Restore must not emit another fade value');
 assert.deepEqual(volumes,[...Array.from({length:50},(_,index)=>100-index*2),100]);assert.deepEqual(delays,[...Array(50).fill(2),50]);assert.ok(stopped);assert.equal(readFileSync(path,'utf8'),source);
}
console.log('Eight timed Roland fades deliver all51 exact volume packets around actual score ticks, stop and original delays; virtual host clock, not browser timing');
for(const generation of ['ms-1990','ms-1991'] as const)for(const stage of ['before','transfer','wait']){
 const seed=versionedMt32MusicSeed(JSON.parse(readFileSync('public/game/mt32-music-slct-seed.json','utf8')),generation),music=createControlledOriginalMt32Music(seed);
 let active=stage!=='before',packets=0,stops=0,writes=0;
 await assert.rejects(fadeTimedMt32Music(music,{async execute(){packets++;if(stage==='transfer')active=false;return 0;},write(){writes++;}},async()=>{active=false;},()=>{stops++;},()=>active),{name:'AbortError'});
 assert.equal(packets,stage==='before'?0:1);assert.equal(stops,0);assert.equal(writes,0,'Superseded fade cannot stop another score or restore its volume');
}
console.log('Superseded timed fades stop before startup, after pending transfer or after tick wait, without later volume/stream-stop operations');
for(const generation of ['ms-1990','ms-1991'] as const){
 const music=createControlledOriginalMt32Music(versionedMt32MusicSeed(JSON.parse(readFileSync('public/game/mt32-music-slct-seed.json','utf8')),generation));
 let active=true,stops=0;const bytes:number[]=[];
 const host={execute:program=>executeTimedMt32Program(program,{read:()=>0,write(port,value){if(port===0x330){bytes.push(value);if(bytes.length===2)active=false;}},interrupts(){},delay(){},cancelled:()=>false}),write(){throw Error('Unexpected stop output');}} satisfies Parameters<typeof fadeTimedMt32Music>[1];
 await assert.rejects(fadeTimedMt32Music(music,host,async()=>{throw Error('Unexpected fade wait');},()=>{stops++;},()=>active),{name:'AbortError'});
 assert.deepEqual(bytes,[0xf0,0x41],'Ownership loss prevents all remaining MIDI bytes even when shared host itself is not cancelled');assert.equal(stops,0);
}
console.log('Both edition fades cancel inside actual transport program before any further MIDI byte after ownership loss');
{
 const music=createControlledOriginalMt32Music(versionedMt32MusicSeed(JSON.parse(readFileSync('public/game/mt32-music-slct-seed.json','utf8')),'ms-1991'));
 let frame=0,command=0;const captured:number[]=[];
 await fadeTimedMt32Music(music,{async execute(){frame+=7;command=frame;return 0;},write(){}},async()=>{},()=>{},()=>true,async()=>{frame+=512;},{volume(_value,position){assert.equal(position,command,'Capture command boundary before delivery can dispatch more bytes');assert.notEqual(position,frame);captured.push(position!);},stopped(){}},()=>frame);
 assert.equal(captured.length,50);assert.ok(captured.every((value,index)=>value===7+index*519));
}
console.log('Fade command positions are captured before delivery catch-up, not from later callback writes');
