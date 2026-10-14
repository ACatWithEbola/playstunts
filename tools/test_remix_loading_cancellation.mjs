import assert from 'node:assert/strict';
import {decodeRemixedMusic,preloadRemixedMusicFiles} from '../lib/game/remixed-music.ts';
const previousFetch=globalThis.fetch;
const paths=Object.fromEntries(['titl','slct','vict','over'].map(name=>[name,'https://audio.invalid/cancel-test/'+name]));
const context={async decodeAudioData(){return {duration:100};}};
async function cancelled(pending){
 let timer;
 try{await Promise.race([assert.rejects(pending,{name:'AbortError'}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cancellation stalled')),500);})]);}
 finally{clearTimeout(timer);}
}
try{
 // Pre-aborted requests must not transfer or decode any bytes.
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Unexpected transfer');};
 const early=new AbortController();early.abort();await cancelled(decodeRemixedMusic(context,['titl'],paths,early.signal));assert.equal(calls,0);
 // Network cancellation must reach fetch; a retry owns a fresh transfer.
 let networkSignal,networkCache;globalThis.fetch=(_path,options)=>new Promise((_,reject)=>{networkCache=options.cache;calls++;networkSignal=options.signal;options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 const downloading=new AbortController(),network=decodeRemixedMusic(context,['titl'],paths,downloading.signal);
 downloading.abort();await cancelled(network);assert.equal(networkSignal.aborted,true);
 assert.equal(networkCache,'no-store','Run-owned timing tests must bypass cached failed responses');
 globalThis.fetch=async()=>{calls++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
 const retried=await decodeRemixedMusic(context,['titl'],paths,new AbortController().signal);assert.equal(retried.titl.duration,100);assert.equal(calls,2);
 // A run-owned transfer cannot inherit or cancel an unrelated shared prefetch.
 let releaseShared;const received=[];
 globalThis.fetch=(_path,options)=>{received.push(options.signal);return options.signal?new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true})):new Promise(resolve=>{releaseShared=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});});};
 const shared=preloadRemixedMusicFiles(['slct'],paths),owner=new AbortController(),owned=decodeRemixedMusic(context,['slct'],paths,owner.signal);
 owner.abort();await cancelled(owned);assert.equal(received.length,2);assert.equal(received[0],undefined);assert.equal(received[1],owner.signal);
 releaseShared();assert.equal((await shared).slct.byteLength,8);
 // Abort also breaks a browser decoder wait that cannot itself be cancelled.
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});
 let enterDecode,finishDecode;const entered=new Promise(resolve=>{enterDecode=resolve;});
 const decodingOwner=new AbortController();
 const decoding=decodeRemixedMusic({decodeAudioData(){enterDecode();return new Promise((_,reject)=>{finishDecode=()=>reject(Error('Late decoder rejection'));});}},['vict'],paths,decodingOwner.signal);
 await entered;decodingOwner.abort();await cancelled(decoding);finishDecode();await new Promise(resolve=>setImmediate(resolve));
 // Successful owned loads never populate the shared cache.
 let transfers=0;globalThis.fetch=async()=>{transfers++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
 await decodeRemixedMusic(context,['over'],paths,new AbortController().signal);
 await preloadRemixedMusicFiles(['over'],paths);await preloadRemixedMusicFiles(['over'],paths);assert.equal(transfers,2);
}finally{globalThis.fetch=previousFetch;}
console.log('Music load aborts before/during transfer and decoder wait; retry works, shared cache remains independent and late rejection is consumed');
