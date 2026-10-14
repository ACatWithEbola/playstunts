import assert from 'node:assert/strict';
import {runBrowserNativeDemo} from '../lib/game/browser-native-demo.ts';
for(const soundDevice of [{kind:'pc-speaker'},{kind:'tandy'},{kind:'adlib'},{kind:'mt32',driverGeneration:'ms-1990'}]){
 let touched=0;
 const options={data:{soundDevice},timedMt32:{generation:'ms-1991',patch:new Uint8Array(1),profile:{},stopMusic:async()=>{touched++;}},get canvas(){touched++;throw Error('Unexpected canvas access');}};
 await assert.rejects(runBrowserNativeDemo(options as never),/matching allocated driver generation/);assert.equal(touched,0);
}
const prior=Object.getOwnPropertyDescriptor(globalThis,'window');
try{
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{hostname:'localhost',search:''}}});
 const controller=new AbortController();let stop=0,allocations=0;
 const options={context:{sampleRate:48000},data:{soundDevice:{kind:'mt32',driverGeneration:'ms-1991'},get base(){allocations++;throw Error('Must not allocate after music failure');}},timedMt32:{generation:'ms-1991',patch:new Uint8Array(1),profile:{},async stopMusic(){stop++;throw Error('Music release failed');}},signal:controller.signal};
 await assert.rejects(runBrowserNativeDemo(options as never),/Music release failed/);assert.equal(stop,1);assert.equal(allocations,0);
 await assert.rejects(runBrowserNativeDemo({...options,timedMt32:{...options.timedMt32,async stopMusic(){controller.abort();}}} as never),{name:'AbortError'});assert.equal(allocations,0);
}finally{if(prior)Object.defineProperty(globalThis,'window',prior);else Reflect.deleteProperty(globalThis,'window');}
console.log('Browser timed demo rejects incompatible drivers before UI/allocation; failed or cancelled music release prevents acquisition');
