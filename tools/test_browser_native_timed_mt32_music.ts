import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBrowserNativeTimedMt32Music} from '../lib/game/browser-native-timed-mt32-music.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
const profile={cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:async()=>{}};
let loads=0,fetches=0,physicalCloses=0,changed=false,resourceFailure=false,abortDuringLoad:AbortController|undefined;
const device={sampleRate:32000,active:()=>false,write(){},render(frames:number){return new Float32Array(frames*2);},close(){physicalCloses++;}};
let live:typeof device|undefined;
const power={get device(){return live;},output:device,async powerOn(){loads++;live=device;return true;},close(){physicalCloses++;}};
const originalFetch=globalThis.fetch;
globalThis.fetch=(async(input:RequestInfo|URL)=>{
 fetches++;const path=String(input);assert.ok(path.startsWith('/game/'));
 if(resourceFailure&&path.endsWith('MT32.PLB'))return new Response(null,{status:503});
 const bytes=readFileSync('public'+path);
 if(changed&&path.endsWith('MT32.PLB'))live=undefined;
 if(abortDuringLoad&&path.endsWith('MT32.PLB'))abortDuringLoad.abort();
 return new Response(bytes,{status:200});
}) as typeof fetch;
const context={} as AudioContext;
try{
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(createBrowserNativeTimedMt32Music(context,aborted.signal,power as any,'ms-1991',profile),{name:'AbortError'});
 assert.equal(loads,0);assert.equal(fetches,0);
 for(const generation of ['ms-1990','ms-1991'] as const){
 const controller=new AbortController();const fetchesBefore:number=fetches;
 const connected=await createBrowserNativeTimedMt32Music(context,controller.signal,power as any,generation,profile);
 assert.equal(loads,1);assert.equal(fetches-fetchesBefore,5);assert.equal(connected.power,power);assert.equal(connected.device,device,'Connector exposes the device captured by its music factory');
 assert.equal(await connected.music.controlAsync('toggle-music'),0);
 assert.equal(connected.music.settings.musicEnabled,false,'Connector must forward live settings getter');
 controller.abort();await connected.music.closeAsync();assert.equal(physicalCloses,0);
 }
 changed=true;
 await assert.rejects(createBrowserNativeTimedMt32Music(context,new AbortController().signal,power as any,'ms-1990',profile),{name:'AbortError'});
 assert.equal(physicalCloses,0);
 changed=false;resourceFailure=true;live=device;
 await assert.rejects(createBrowserNativeTimedMt32Music(context,new AbortController().signal,power as any,'ms-1991',profile),/resource failed to load/);
 resourceFailure=false;abortDuringLoad=new AbortController();
 await assert.rejects(createBrowserNativeTimedMt32Music(context,abortDuringLoad.signal,power as any,'ms-1991',profile),{name:'AbortError'});
 abortDuringLoad=undefined;
 const fetchesBeforeUnavailable=fetches;
 await assert.rejects(createBrowserNativeTimedMt32Music(context,new AbortController().signal,{...power,device:undefined,async powerOn(){return false;}} as any,'ms-1991',profile),{name:'AbortError'});
 assert.equal(fetches,fetchesBeforeUnavailable,'Failed power-on must not fetch song resources');
 assert.equal(physicalCloses,0,'Connector failures cannot close caller-owned synthesizer');
}finally{globalThis.fetch=originalFetch;}
console.log('Browser timed Roland connector rejects pre/mid-load abort, unavailable power, failed resource and device replacement; physical power ownership stays external');
