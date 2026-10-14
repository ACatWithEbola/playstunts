import assert from 'node:assert/strict';
import {futureRaceSettings,replayVideoSettings,configuredFutureRaceCadence} from '../lib/game/future-race-settings.ts';
import {browserPreviewGraphicsSettings,graphicsSettingsForFutureEngine,createBrowserMenuGraphicsSettings} from '../lib/game/browser-future-race-engine.ts';
assert.deepEqual(graphicsSettingsForFutureEngine('ms-1991'),{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20},'Release MS91 capability must not depend on localhost');
for(const engine of ['ms-1990','bb-1991'] as const)assert.equal(graphicsSettingsForFutureEngine(engine),undefined,'Other engines retain prior settings capability');
for(const hostname of ['playstunts.com','example.com'])assert.deepEqual(browserPreviewGraphicsSettings({hostname,search:'?preview-engine=ms-1990'}),{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20},'Public preview overrides cannot replace the released default');
for(const hostname of ['localhost','127.0.0.1','[::1]','::1']){
 assert.deepEqual(browserPreviewGraphicsSettings({hostname,search:'?preview-engine=ms-1991'}),{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20});
 assert.deepEqual(browserPreviewGraphicsSettings({hostname,search:''}),{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20});
 assert.equal(browserPreviewGraphicsSettings({hostname,search:'?preview-engine=ms-1990'}),undefined);
}
const data={base:new Uint8Array([1,2]),framesPerSecond:20 as const},before=structuredClone(data);
for(const rate of [10,20] as const)for(const slow of [false,true]){
 const settings={graphics:2,slowVideoManagement:slow,configuredFramesPerSecond:rate},snapshot=structuredClone(settings),result=futureRaceSettings(data,'ms-1991',settings);
 assert.equal(configuredFutureRaceCadence('ms-1991',settings),rate);assert.equal(configuredFutureRaceCadence('ms-1990',settings),20);
 assert.equal(result.physicsEngine,'ms-1991');assert.equal(result.framesPerSecond,rate);assert.equal(result.experimental10Hz,rate===10);assert.equal(result.experimentalMs91SlowVideoManagement,slow);assert.equal(result.base,data.base);
 assert.deepEqual(futureRaceSettings(data,'ms-1990',settings),{...data,physicsEngine:'ms-1990'});assert.deepEqual(settings,snapshot);
 const replay=replayVideoSettings({...data,physicsEngine:'ms-1990' as const},settings);assert.equal(replay.physicsEngine,'ms-1990');assert.equal(replay.framesPerSecond,20);assert.equal(replay.experimental10Hz,true);assert.equal(replay.experimentalMs91SlowVideoManagement,slow);
}
assert.deepEqual(futureRaceSettings(data,'ms-1991'),{...data,physicsEngine:'ms-1991'});
for(const settings of [{graphics:5,slowVideoManagement:true,configuredFramesPerSecond:20},{graphics:2,slowVideoManagement:1,configuredFramesPerSecond:20},{graphics:2,slowVideoManagement:true,configuredFramesPerSecond:15}])assert.throws(()=>futureRaceSettings(data,'ms-1991',settings as never));
assert.throws(()=>futureRaceSettings(data,'bb-1991'));assert.deepEqual(data,before);
assert.deepEqual(replayVideoSettings(data),{...data,experimental10Hz:true});
assert.deepEqual(data,before,'Granting private playback must not alter future settings');
console.log('Fresh MS91 settings route explicit cadence/video policy without mutating data/settings or affecting legacy/omitted settings');
for(const supplied of [undefined,{graphics:2,slowVideoManagement:false,configuredFramesPerSecond:10 as const}]){
 const select=createBrowserMenuGraphicsSettings(supplied);
 assert.equal(select('ms-1990'),undefined);assert.equal(select('bb-1991'),undefined);
 const modern=select('ms-1991');assert.ok(modern);
 if(supplied)assert.equal(modern,supplied);
 else assert.deepEqual(modern,{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20});
 modern.graphics=3;assert.equal(select('ms-1990'),undefined);
 assert.equal(select('ms-1991'),modern);assert.equal(select('ms-1991')!.graphics,3);
 const recorded={physicsEngine:'ms-1990' as const,framesPerSecond:20 as const};
 const metadata=replayVideoSettings(recorded,modern);
 assert.equal(metadata.physicsEngine,recorded.physicsEngine);assert.equal(metadata.framesPerSecond,recorded.framesPerSecond);
}
console.log('Imported modern-menu capabilities survive legacy launches/switches without changing replay engine or cadence');
const slowReplay={base:data.base,physicsEngine:'ms-1991' as const,framesPerSecond:10 as const,experimental10Hz:true,experimentalMs91SlowVideoManagement:true};
const slowBefore=structuredClone(slowReplay);
const freshLegacy=futureRaceSettings(slowReplay,'ms-1990');
assert.equal(freshLegacy.framesPerSecond,20,'A fresh legacy race cannot inherit a private replay cadence');
assert.equal(freshLegacy.experimental10Hz,undefined);assert.equal(freshLegacy.experimentalMs91SlowVideoManagement,undefined);
assert.deepEqual(slowReplay,slowBefore,'Fresh-race selection must not rewrite the loaded slow replay');
for(const rate of [0,15,null,'10']){
 assert.throws(()=>futureRaceSettings({...slowReplay,framesPerSecond:rate} as never,'ms-1990'),/Unsupported replay cadence/,'Do not conceal invalid metadata by resetting it to20Hz');
}
