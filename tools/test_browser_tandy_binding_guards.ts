import assert from 'node:assert/strict';
import {runBrowserNativeManualRace} from '../lib/game/browser-native-manual-race.ts';
import {runBrowserNativeDemo} from '../lib/game/browser-native-demo.ts';
for(const run of [runBrowserNativeManualRace,runBrowserNativeDemo]){
 for(const soundDevice of [{kind:'tandy',driverGeneration:'ms-1990'},{kind:'tandy'},{kind:'pc-speaker'},{kind:'adlib'},{kind:'mt32'}]){
  let touched=0;
  const options={data:{soundDevice},context:{sampleRate:48000},tandyBinding:{sampleRate:48000},
   get menus(){touched++;throw Error('Must not reach browser input');},get canvas(){touched++;throw Error('Must not reach drawing');}};
  await assert.rejects(run(options as never),/matching modern driver and browser audio rate/);assert.equal(touched,0);
 }
 await assert.rejects(run({data:{soundDevice:{kind:'tandy',driverGeneration:'ms-1991'}},context:{sampleRate:44100},tandyBinding:{sampleRate:48000}} as never),/matching modern driver and browser audio rate/);
}
console.log('Both browser race/demo entry points reject wrong Tandy device, missing/legacy generation and mismatched sample rate before allocation, input or drawing');
