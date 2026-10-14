import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeReplayRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
const path=new URL('../public/game/replays/DEFAULT.RPL',import.meta.url),source=new Uint8Array(readFileSync(path)),before=source.slice();
const menu={configuration:Array.from(source.slice(0,24)),track:Array.from(source.slice(24,0x722)),name:'DEFAULT',camera:2,graphics:2,soundEnabled:false},recording={bytes:source,name:'DEFAULT',path:'',physicsEngine:'ms-1990' as const,framesPerSecond:20 as const},host={resetMouse(){},async key(){return 27;}};
const control=await createNativeReplayRaceRuntime({...fixtureData,physicsEngine:'ms-1990'},menu,recording,host);
const future=await createNativeReplayRaceRuntime({...fixtureData,physicsEngine:'ms-1991',experimentalMs91SlowVideoManagement:true},menu,recording,host);
for(const runtime of [control,future]){assert.equal(runtime.session.physicsEngine,'ms-1990');runtime.enableGraphicsCapture();}
for(const frame of [0,1,100,300]){
 for(const runtime of [control,future])runtime.session.seek(frame);
 assert.deepEqual(future.renderCockpitWorld(),control.renderCockpitWorld(),'Future engine/video settings must not change legacy replay pixels at'+frame);
 const a=future.graphicsFrame()!,b=control.graphicsFrame()!;assert.ok(a&&b);assert.ok(JSON.stringify(a.calls)===JSON.stringify(b.calls));assert.ok(Buffer.from(a.mask).equals(Buffer.from(b.mask)));
 assert.ok(Buffer.from(future.session.state.memory).equals(Buffer.from(control.session.state.memory)),'Legacy replay state remains identical after seek/render');
}
assert.deepEqual(source,before);assert.deepEqual(new Uint8Array(readFileSync(path)),before);
console.log('Loaded legacy replay keeps legacy engine, pixels, enhanced geometry/mask and state despite future MS91 slow-video settings; original bytes unchanged');
