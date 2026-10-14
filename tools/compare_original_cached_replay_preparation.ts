import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
const [path,root,initialEngine='ms-1990']=process.argv.slice(2);if(!path||!root)throw Error('Provide modern opponent probe and original reconstruction root');
if(initialEngine!=='ms-1990'&&initialEngine!=='ms-1991')throw Error('Unsupported initial engine');
const source=readFileSync(path),bytes=decodeVersionedReplay(source,'ms-1991').bytes;
const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine:initialEngine},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'CACHEQA',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
runtime.session.skipIntroduction();
let memory:()=>Uint8Array,preparation:Uint8Array|undefined;
const loaded=await loadAllocatedReplay({...fixtureData,physicsEngine:initialEngine},runtime,{
 async selectReplay(getMemory){memory=getMemory;return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine(){return 'ms-1990';},replayFramesPerSecond(){return 20;},showWaiting(){},writeAudio(){},progress(stage){if(stage===2){assert.equal(preparation,undefined,'One unchanged-opponent refresh expected');preparation=memory().slice();}}
});
assert.ok(loaded&&preparation&&loaded.opponentPath);
const result=spawnSync('python3',['tools/check_original_opponent_cache_cycle.py',root,'--memory-from-stdin'],{input:JSON.stringify({memory:Buffer.from(preparation).toString('base64'),framePointer:0xee8e,count:loaded.opponentPath.length}),encoding:'utf8',maxBuffer:8*1024*1024});
assert.equal(result.status,0,result.stderr||'Original emulator failed');
const original=JSON.parse(result.stdout);assert.deepEqual(original.path,loaded.opponentPath,'Same retained allocation state must produce the original opponent route');
assert.deepEqual(readFileSync(path),source);
console.log(JSON.stringify({initialEngine,loadedEngine:loaded.session.physicsEngine,opponent:bytes[6],pathWords:original.path.length,originalReads:original.reads,matched:true,sourceUnchanged:true}));
