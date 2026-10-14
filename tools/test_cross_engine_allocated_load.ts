import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import type {PhysicsEngineVersion} from '../lib/physics/engine-version.ts';
import {soundResourceOffset} from '../lib/game/sound-resource.ts';
import {spawnSync} from 'node:child_process';
import {createLoadedNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
const [path,legacyPath,originalRoot]=process.argv.slice(2);if(!path||!legacyPath||!originalRoot)throw Error('Pass a modern20 Hz opponent probe, genuine legacy replay AND original reconstruction root; do not silently skip original route verification');
const original=new Uint8Array(readFileSync(path)),before=original.slice();
const legacyOriginal=new Uint8Array(readFileSync(legacyPath)),legacyBefore=legacyOriginal.slice(),legacyReplay=decodeVersionedReplay(legacyOriginal,'ms-1990');
assert.equal(legacyReplay.framesPerSecond,20);
const decoded=decodeVersionedReplay(original,'ms-1991');assert.equal(decoded.framesPerSecond,20);assert.ok(decoded.bytes[6]>=1&&decoded.bytes[6]<=6);
const legacySpeeds=[80,110,90,90,100,150],modernSpeeds=[90,120,110,120,140,175];
const bytes=decoded.bytes,menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'CROSS',camera:0,graphics:2,soundEnabled:false};
let runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine:'ms-1990'},menu,{resetMouse(){}});
runtime.session.skipIntroduction();
const cars=(memory:Uint8Array,opponent:boolean)=>{const state=readRecordedTwoCarRace(memory,0x2d1a0);return {player:state.player.driving.car,...(opponent?{opponent:state.opponent.car}:{})};};
assert.equal(runtime.session.state.memory[0x2d1a0+0x9362+9],legacySpeeds[bytes[6]-1]);
const cases=[...(['ms-1990','ms-1991','ms-1990','ms-1991'] as PhysicsEngineVersion[]).map(engine=>({engine,bytes})),{engine:'ms-1990' as const,bytes:legacyReplay.bytes}];
for(const {engine,bytes:current} of cases){
 let getMemory:()=>Uint8Array,preparation:Uint8Array|undefined;
 const currentMenu={...menu,configuration:Array.from(current.slice(0,24)),track:Array.from(current.slice(24,0x722))};
 const loaded=await loadAllocatedReplay({...fixtureData,physicsEngine:runtime.session.physicsEngine},runtime,{
  async selectReplay(memory){getMemory=memory;return 1;},async readReplay(){return current.slice();},replayPhysicsEngine(){return engine;},replayFramesPerSecond(){return 20;},showWaiting(){},progress(stage){if(stage===2)preparation=getMemory().slice();},writeAudio(){}
 });
 assert.ok(loaded);runtime=loaded;
 assert.equal(runtime.session.physicsEngine,engine);
 if(current[6]!==0)assert.equal(runtime.session.state.memory[0x2d1a0+0x9362+9],(engine==='ms-1991'?modernSpeeds:legacySpeeds)[current[6]-1]);
 let fresh=await createNativeManualRaceSession({...fixtureData,physicsEngine:engine},currentMenu,{resetMouse(){}});
 fresh.session.skipIntroduction();
 if(engine==='ms-1990'&&current[6]!==0){
  assert.ok(preparation&&runtime.opponentPath,'Capture exact retained allocation state before original route preparation');
  const result=spawnSync('python3',['tools/check_original_opponent_cache_cycle.py',originalRoot,'--memory-from-stdin'],{input:JSON.stringify({memory:Buffer.from(preparation).toString('base64'),framePointer:0xee8e,count:runtime.opponentPath.length}),encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr||'Original emulator failed');
  const originalPath=JSON.parse(result.stdout).path;assert.deepEqual(runtime.opponentPath,originalPath,'Legacy cached path must match original code from identical retained memory');
  // Keep the independently allocated car resources/state, but seed its route
  // from original code rather than assuming unrelated allocations pick it.
  const reference=createLoadedNativeManualRaceSession({...fixtureData,physicsEngine:engine},{memory:fresh.session.state.memory.slice(),raw:fresh.raw,trackAddress:fresh.trackAddress,initialWrites:[],opponentPath:originalPath});
  fresh={...fresh,session:reference.session};
 }
 if(current[6]!==0)assert.deepEqual(runtime.session.state.memory.slice(0x2d1a0+0x9362,0x2d1a0+0x9362+16),fresh.session.state.memory.slice(0x2d1a0+0x9362,0x2d1a0+0x9362+16),'Complete opponent speed profile must match independent reference');
 if(process.env.CROSS_ENGINE_FIRST_DIFFERENCE==='1'){
  runtime.session.seek(0);
  for(let frame=1;frame<=runtime.session.length;frame++){
   for(const session of [runtime.session,fresh.session]){captureOriginalRaceInput(session.state.memory,0x2d1a0,current[0x722+frame-1]);session.originalMemory.writeMemory(session.state.memory);session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});}
   const actual=cars(runtime.session.state.memory,current[6]!==0),expected=cars(fresh.session.state.memory,current[6]!==0);
   if(JSON.stringify(actual)!==JSON.stringify(expected))console.log(JSON.stringify({firstDifference:frame,engine,opponent:current[6],actualOpponent:actual.opponent,expectedOpponent:expected.opponent}));
   assert.deepEqual(actual,expected,'Sequential first difference for '+engine+' opponent '+current[6]+' at '+frame);
  }
  throw Error('Sequential frames match: investigate seek/checkpoint differences instead');
 }
 if(process.env.CROSS_ENGINE_DIAGNOSTICS==='1'){
  const cachedOpponent=(memory:Uint8Array)=>{const d=0x2d1a0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(offset:number)=>v.getUint16(d+offset,true),banks=[];
   for(let at=word(0x4b12);at<word(0x4b18);at+=18){
    const name=Buffer.from(memory.subarray(d+at,d+at+12)).toString().split('\0')[0];
    if(!/^(opp|m91opp)/i.test(name))continue;
    const address=word(at+14)*16,size=v.getUint32(address,true),bank=memory.subarray(address,address+size),sped=soundResourceOffset(bank,new TextEncoder().encode('sped'));
    banks.push({name,size,address,flags:word(at+16),pages:word(at+12),sped,costs:sped===null?[]:Array.from(memory.subarray(address+sped,address+sped+256))});
   }return banks;
  };
  console.log(JSON.stringify({engine,opponent:current[6],actualCached:cachedOpponent(runtime.session.state.memory),freshCached:cachedOpponent(fresh.session.state.memory)}));
  const routeWords=(memory:Uint8Array)=>{const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),at=view.getUint16(0x2d1a0+0x7ff6,true)*16+view.getUint16(0x2d1a0+0x7ff4,true);return Array.from({length:901},(_,i)=>view.getUint16(at+i*2,true));};
  const actual=routeWords(runtime.session.state.memory),expected=routeWords(fresh.session.state.memory);
  console.log(JSON.stringify({engine,opponent:current[6],routeDifferences:actual.flatMap((value,index)=>value===expected[index]?[]:[{index,actual:value,expected:expected[index]}]),profileEqual:Buffer.from(runtime.session.state.memory.subarray(0x2d1a0+0x9362,0x2d1a0+0x9362+16)).equals(Buffer.from(fresh.session.state.memory.subarray(0x2d1a0+0x9362,0x2d1a0+0x9362+16)))}));
 }
 assert.deepEqual(runtime.raw,Array.from(current.slice(24,0x722)));
 assert.equal(runtime.session.length,current.length-0x722);
 const referenceStart=fresh.session.state.memory.slice();
 for(const frame of [0,1,20,100,runtime.session.length]){
  runtime.session.seek(0);runtime.session.seek(frame);
  fresh.session.originalMemory.writeMemory(referenceStart.slice());fresh.session.initializeLoadedReplay();
  fresh.session.state.memory[0x2d1a0+0x9aca]=1;fresh.session.state.memory[0x2d1a0+0xa3c2]=2;
  let driven=0;
  while(driven<frame){assert.ok(captureOriginalRaceInput(fresh.session.state.memory,0x2d1a0,current[0x722+driven]).recorded);fresh.session.originalMemory.writeMemory(fresh.session.state.memory);let steps=0;fresh.session.advanceCaptured({entryStackPointer:0xfefc,incomingSI:frame-driven},()=>{assert.ok(++steps<=2,'Independent seek reference failed to converge its clock at '+driven+' for '+engine+' opponent '+current[6]);});driven++;}
  const actual=cars(runtime.session.state.memory,current[6]!==0),expected=cars(fresh.session.state.memory,current[6]!==0);
  // The original zero-frame initializer retains wheel-coordinate scratch from
  // its previous run. Actual wheel positions must agree after the first tick.
  if(frame===0)for(const state of [actual,expected])for(const car of Object.values(state))delete car.wheelPositions;
  assert.deepEqual(actual,expected,'Allocated engine switch matches independent fresh interpretation for '+engine+' at frame '+frame);
  assert.equal(runtime.session.state.memory[0x2d1a0+0x8018]&1,0,'Replay viewing must not become a newly eligible completed race');
 }
 if(current===legacyReplay.bytes)assert.equal(runtime.session.state.player.driving.car.grip.crash,3,'Genuine legacy SKIDS reference still reaches its finish');
}
assert.deepEqual(new Uint8Array(readFileSync(path)),before);
assert.deepEqual(new Uint8Array(readFileSync(legacyPath)),legacyBefore);
console.log('In-race engine switching preserves profiles and complete active-car replay state, including genuine legacy playback after MS91; source files unchanged');
