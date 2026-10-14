import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {createNativeOriginalRenderer} from '../lib/game/native-original-renderer.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {prepareOriginalRaceViewport} from '../lib/game/race-viewport.ts';
import {analyzeRoute} from '../lib/physics/route-analysis.ts';
import {drawNativeFullRedrawRaceLayers} from '../lib/game/full-redraw-race-layers.ts';
import type {NativeRaceCopyPresentation} from '../lib/game/full-redraw-display-race-layers.ts';

const path=process.argv[2];if(!path)throw Error('Provide a complete MS91 replay');
const camera=Number(process.env.MS91_RENDER_CAMERA??0);if(!Number.isInteger(camera)||camera<0||camera>3)throw Error('Render camera must be 0..3');
const video=process.env.MS91_VIDEO_MANAGEMENT??'slow';if(video!=='slow'&&video!=='fast')throw Error('Video management must be slow or fast');
const partial=process.env.MS91_PARTIAL_BACKGROUND==='1';if(partial&&video!=='slow')throw Error('Partial background requires slow video management');
const selective=process.env.MS91_SELECTIVE_COPY==='1';if(selective&&!partial)throw Error('Selective copy requires retained background');
const tracking={experimentalMs91RegionFlags:true,experimentalMs91SlowVideoManagement:video==='slow',experimentalMs91PartialBackground:partial};
const status=process.env.MS91_RENDER_CAR_STATUS===undefined?undefined:Number(process.env.MS91_RENDER_CAR_STATUS);if(status!==undefined&&(!Number.isInteger(status)||status<0||status>2))throw Error('Detached render car status must be 0..2');
const source=readFileSync(path),{bytes,framesPerSecond}=decodeVersionedReplay(source,'ms-1991');
const data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond,experimental10Hz:framesPerSecond===10};
const race=await createNativeManualRaceSession(data,{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'RENDER',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
const analysis=analyzeRoute(race.raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});
const options={allocatedResources:true,originalViewport:true,originalCameras:{objects:data.objects,planes:data.planes}};
const explicit=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine});
const reference=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,options);
const enhanced=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine});
const tracked=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine,...tracking});
const trackedEnhanced=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine,...tracking});
const layered=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine});
const trackedLayered=createNativeOriginalRenderer(race.session.state.memory,race.raw,analysis,{...options,physicsEngine:race.session.physicsEngine,...tracking,experimentalMs91SelectiveCopy:selective});
assert.equal(explicit.physicsEngine,'ms-1991');
const ticks=bytes[22]|bytes[23]<<8;assert.equal(bytes.length,0x722+ticks);
let samples=0,polygons=0,localCarRegions=0;
for(let tick=0;tick<=ticks;tick++){
 if(tick){captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+tick-1],framesPerSecond);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});}
 if(tick===0||tick===1||tick%100===0||tick===ticks){
  const live=race.session.state.memory,before=live.slice(),input=live.slice();input[0x2d1a0+0x12f]=camera;if(status!==undefined)input[0x2d1a0+0x8ce9]=input[0x2d1a0+0x8da1]=status;prepareOriginalRaceViewport(input,0x2d1a0,0xeefe);
  if(partial)input[0x2d1a0+0x9ab6]=Number(tick===0);
  const inputBefore=input.slice();
  if(partial&&tick===100){assert.throws(()=>tracked.render(input,undefined,undefined,undefined,false,(_memory,world)=>{world();throw Error('Injected presentation failure');}),/Injected presentation failure/);assert.deepEqual(input,inputBefore,'Failed partial rendering still preserves source input');}
  assert.deepEqual(explicit.render(input),reference.render(input),'Engine metadata must not change existing default pixels at tick '+tick);
  assert.deepEqual(tracked.render(input),explicit.render(input),'MS91 descriptor tracking must preserve full-redraw pixels at tick '+tick);
  assert.ok(tracked.view!.submissions.length>0,'Tracked path submits real models');
  if(video==='slow')assert.ok(tracked.view!.submissions.every(record=>!!(record[18]&8)),'All slow-video model submissions carry region flag08');
  else for(const record of tracked.view!.submissions){const pointer=record[8]|record[9]<<8;if(pointer===0xeefe-0x6a||pointer===0xeefe-0x8e){assert.equal(record[18],12);localCarRegions++;}}
  enhanced.render(input,undefined,undefined,undefined,true);
  trackedEnhanced.render(input,undefined,undefined,undefined,true);
  assert.deepEqual(trackedEnhanced.view!.calls,enhanced.view!.calls,'Region tracking preserves enhanced raster calls and fractional geometry at tick '+tick);
  assert.deepEqual(trackedEnhanced.view!.wheels,enhanced.view!.wheels,'Region tracking preserves enhanced wheel geometry at tick '+tick);
  assert.deepEqual(trackedEnhanced.view!.fireballMask,enhanced.view!.fireballMask,'Region tracking preserves crash mask at tick '+tick);
  assert.deepEqual(trackedEnhanced.view!.position,enhanced.view!.position);
  assert.deepEqual(trackedEnhanced.view!.angles,enhanced.view!.angles);
  const layerInput=input.slice(),trackedLayerInput=input.slice();
  const layers=(live:Uint8Array)=>(memory:Uint8Array,world:()=>void,copy?:NativeRaceCopyPresentation)=>drawNativeFullRedrawRaceLayers(memory,live,0x2d1a0,0xeefe,world,{physicsEngine:race.session.physicsEngine,framesPerSecond},copy);
  assert.deepEqual(trackedLayered.render(trackedLayerInput,undefined,undefined,undefined,true,layers(trackedLayerInput)),layered.render(layerInput,undefined,undefined,undefined,true,layers(layerInput)),'Actual cockpit/status layer pixels preserved at tick '+tick);
  assert.deepEqual(trackedLayerInput,layerInput,'Layer presentation state changes stay identical at tick '+tick);
  polygons+=enhanced.view?.calls.length??0;
  assert.deepEqual(input,inputBefore,'Both rendering paths preserve detached simulation input');assert.deepEqual(live,before,'Rendering preserves live state');samples++;
 }
}
assert.equal(race.session.state.player.driving.car.grip.crash,3,'Reference reaches finish');
assert.ok(polygons>0,'Enhanced fractional-polygon path must produce geometry');
if(partial)assert.ok(tracked.experimentalPartialBackgroundPasses>0,'Retained MCGA forward background must actually execute');
if(selective){assert.ok(trackedLayered.experimentalCopyPasses>0,'Actual MCGA bitmap copying must execute');assert.ok(trackedLayered.experimentalSelectiveCopyFrames>0,'Non-startup selective presentation must execute');}
if(video==='fast'&&camera!==0&&status===1)assert.ok(localCarRegions>0,'Detached status1 scenario must exercise local car-region submissions');
assert.deepEqual(readFileSync(path),source,'Replay file unchanged');
console.log(`MS91 ${video} video camera ${camera} partial background ${partial} selective copy ${selective} render-only status ${status??'recorded'}: default pixels and enhanced geometry/wheels/crash masks preserved across ${samples} samples through ${ticks} ticks and finish; ${polygons} enhanced draw calls; ${localCarRegions} local car-region submissions; ${trackedLayered.experimentalCopyPasses} bitmap copies over${trackedLayered.experimentalSelectiveCopyFrames} non-startup frames`);
