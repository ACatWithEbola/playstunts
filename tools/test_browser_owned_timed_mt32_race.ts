import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBrowserOwnedTimedMt32Race} from '../lib/game/browser-owned-timed-mt32-race.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
const seed=JSON.parse(readFileSync('public/game/mt32-music-titl-seed.json','utf8'));
const patch=readFileSync('public/game/original-resources/MT32.PLB');
const context={currentTime:0,state:'running',destination:{},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},createBuffer(_n:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}} as unknown as AudioContext;
for(const generation of ['ms-1990','ms-1991'] as const){
 const driver=Uint8Array.from(versionedMt32MusicSeed(seed,generation).driver),before=driver.slice();let ticks=0;
 let delivered=0;
 const device={sampleRate:32000,active:()=>false,write(_writes:number[][]){delivered+=_writes.length;},render:(n:number)=>new Float32Array(n*2)};
 const options={generation,profile:{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},driver:()=>driver,patch,initialWrites:[],tick(){ticks++;return [];},active:()=>true};
 await assert.rejects(createBrowserOwnedTimedMt32Race(context,device,{...options,generation:'invalid' as typeof generation}),/Unsupported/);assert.equal(delivered,0);
 await assert.rejects(createBrowserOwnedTimedMt32Race(context,device,{...options,profile:{...options.profile,cancelled:()=>true}}),{name:'AbortError'});assert.equal(delivered,0);
 const creating=createBrowserOwnedTimedMt32Race(context,device,options);
 options.tick=()=>{throw Error('Mutated callback must not be used');};options.active=()=>false;options.profile.cpuHz=NaN;
 const audio=await creating;
 await audio.pump();assert.ok(ticks>0);await audio.write([]);assert.deepEqual(driver,before);
 const first=audio.closeAsync();assert.equal(audio.closeAsync(),first);await first;
 await assert.rejects(audio.write([]),{name:'AbortError'});
 const second=await createBrowserOwnedTimedMt32Race(context,device,{...options,profile:{...options.profile,cpuHz:4772728},tick:()=>[],active:()=>true});second.close();await assert.rejects(second.write([]),{name:'AbortError'});await second.closeAsync();
 let cleanupFailed=false;
 const brokenDevice={...device,active:()=>cleanupFailed,render(n:number){if(cleanupFailed)throw Error('Tail cleanup failed');return new Float32Array(n*2);}};
 const broken=await createBrowserOwnedTimedMt32Race(context,brokenDevice,{...options,profile:{...options.profile,cpuHz:4772728},tick:()=>[],active:()=>true});
 cleanupFailed=true;const failedClose=broken.closeAsync();await assert.rejects(failedClose,/Tail cleanup failed/);assert.equal(broken.closeAsync(),failedClose,'Failed cleanup cannot later claim successful release');
}
console.log('Both explicit race owners initialize, pump, await release and preserve supplied driver; synthetic device/browser only');
