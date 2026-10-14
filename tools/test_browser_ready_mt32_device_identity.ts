import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBrowserNativeMt32Music} from '../lib/game/browser-native-mt32-music.ts';
const originalFetch=globalThis.fetch;
let live:object|undefined,writes=0,closes=0,replaceOnWrite=false,replaceOnFetch=false;
const device={sampleRate:32000,active:()=>false,write(){writes++;if(replaceOnWrite)live={};},render(frames:number){return new Float32Array(frames*2);}};
const power={get device(){return live;},output:device,powerOn:async()=>{live=device;return true;},close(){closes++;}};
globalThis.fetch=(async(input:RequestInfo|URL)=>{
 const path=String(input);if(replaceOnFetch&&path.endsWith('MT32.PLB'))live={};
 return new Response(readFileSync('public'+path));
}) as typeof fetch;
try{
 replaceOnFetch=true;
 await assert.rejects(createBrowserNativeMt32Music({} as AudioContext,new AbortController().signal,power as any),{name:'AbortError'});
 assert.equal(writes,0,'Stale resource load must not initialize a replacement device');
 replaceOnFetch=false;replaceOnWrite=true;live=device;
 await assert.rejects(createBrowserNativeMt32Music({} as AudioContext,new AbortController().signal,power as any),{name:'AbortError'});
 assert.equal(writes,1,'No later startup batch may reach replacement power');
 assert.equal(closes,0,'Caller-owned power must remain external after failure');
}finally{globalThis.fetch=originalFetch;}
console.log('Ready Roland startup rejects device replacement during fetch and between startup batches without closing caller power');
