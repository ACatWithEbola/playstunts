import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import resource from '../lib/game/ms91-demo-resource.json' with {type:'json'};
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const bundled=versionedDemoResource('ms-1991')!;
const path=process.argv[2],source=path?readFileSync(path):encodeVersionedReplay(bundled.bytes,bundled.physicsEngine,bundled.framesPerSecond),decoded=decodeVersionedReplay(source,'ms-1991');
assert.equal(createHash('sha256').update(source).digest('hex'),resource.sha256,'Bundled demo must retain captured original file identity');
assert.deepEqual(encodeVersionedReplay(bundled.bytes,bundled.physicsEngine,bundled.framesPerSecond),new Uint8Array(source));
assert.equal(versionedDemoResource('ms-1990'),undefined);assert.equal(versionedDemoResource('bb-1991'),undefined);
const snapshot=fixtureData.base.slice(),bytes=decoded.bytes.slice();
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:false};
const runtime=await createNativeDemoRuntime({...fixtureData,physicsEngine:'ms-1990',framesPerSecond:20,experimental10Hz:true,demoReplay:bundled},menu);
const variants=await Promise.all([false,true].map(experimentalMs91SlowVideoManagement=>createNativeDemoRuntime({...fixtureData,experimental10Hz:true,demoReplay:bundled,experimentalMs91SlowVideoManagement},menu)));
assert.equal(runtime.session.physicsEngine,'ms-1991');assert.equal(runtime.session.framesPerSecond,10);assert.equal(runtime.length,958);
for(let tick=0;tick<20000&&runtime.frame<runtime.length;tick++){
 runtime.tick();for(const variant of variants)variant.tick();
 if(tick%100===0){const pixels=runtime.render().slice();for(const variant of variants){assert.deepEqual(variant.render(),pixels,'Demo video-policy pixels at tick'+tick);assert.deepEqual(variant.session.state.memory,runtime.session.state.memory,'Demo simulation state at tick'+tick);}}
 const exit=runtime.finishFrame(0,0);for(const variant of variants)assert.equal(variant.finishFrame(0,0),exit);if(exit==='exit')break;
}
assert.equal(runtime.session.state.player.driving.car.grip.crash,3,'Original MS91 demo reaches its finish');
let counter=0;const cleanup:string[]=[];
const restored=await runtime.finish({writeAudio(){},async gameCounter(){return counter+=100;},async releaseInput(){cleanup.push('release');},showWaiting(){cleanup.push('waiting');},copyBackBuffer(){cleanup.push('copy');},resetMouse(){cleanup.push('mouse');}});
assert.deepEqual(restored.configuration,menu.configuration,'Demo must restore the menu car/opponent settings');
assert.deepEqual(restored.track,menu.track,'Demo must restore the menu track');
assert.deepEqual(cleanup,['copy','mouse','release','waiting']);
for(const variant of variants){assert.equal(variant.session.state.player.driving.car.grip.crash,3);const result=await variant.finish({writeAudio(){},async gameCounter(){return counter+=100;},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){}});assert.deepEqual(result.configuration,menu.configuration);assert.deepEqual(result.track,menu.track);}
await assert.rejects(()=>runtime.finish({writeAudio(){},async gameCounter(){return 0;},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){}}),/already been released/);
assert.deepEqual(fixtureData.base,snapshot);assert.deepEqual(decoded.bytes,bytes);if(path)assert.deepEqual(readFileSync(path),source);
const legacy=await createNativeDemoRuntime(fixtureData,menu);
assert.equal(legacy.session.physicsEngine,'ms-1990');assert.equal(legacy.session.framesPerSecond,20);
assert.equal(legacy.length,4183-0x722,'Omitted versioned demo keeps the original bundled recording');
const legacyRestored=await legacy.finish({writeAudio(){},async gameCounter(){return counter+=100;},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){}});
assert.deepEqual(legacyRestored.configuration,menu.configuration);assert.deepEqual(legacyRestored.track,menu.track);
assert.deepEqual(fixtureData.base,snapshot);
console.log('Explicit original MS91 demo loads at recorded10Hz, renders, finishes, releases resources once and restores menu configuration/track without mutating source/base');
