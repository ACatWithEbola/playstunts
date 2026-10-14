import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {prepareNativeDisplayRace} from '../lib/game/prepare-native-display-race.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {prepareOriginalRaceViewport} from '../lib/game/race-viewport.ts';
import {createNativeDisplayRaceRenderer} from '../lib/game/native-display-race-renderer.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {allocateOriginalDisplayWindow} from '../lib/game/allocate-display-window.ts';
const path=process.argv[2];if(!path)throw Error('Provide original MS91 opponent replay');
const video=process.env.MS91_VIDEO_MANAGEMENT??'slow';if(video!=='slow'&&video!=='fast')throw Error('Video management must be slow or fast');
const selective=process.env.MS91_REGION_SELECTION!=='0'&&video==='slow';
const status=process.env.MS91_RENDER_CAR_STATUS===undefined?undefined:Number(process.env.MS91_RENDER_CAR_STATUS);if(status!==undefined&&(!Number.isInteger(status)||status<0||status>2))throw Error('Detached car status must be0..2');
const graphics=Number(process.env.MS91_RENDER_DETAIL??2);if(!Number.isInteger(graphics)||graphics<0||graphics>4)throw Error('Render detail must be0..4');
const camera=Number(process.env.MS91_RENDER_CAMERA??0);if(!Number.isInteger(camera)||camera<0||camera>3)throw Error('Render camera must be0..3');
const source=readFileSync(path),{bytes,framesPerSecond}=decodeVersionedReplay(source,'ms-1991'),packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond,experimental10Hz:framesPerSecond===10},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'COPY',camera,graphics,soundEnabled:false},{resetMouse(){}});race.session.skipIntroduction();
const live=race.session.state.memory;
// Original race entry resets camera selection to cockpit. Exercise other
// views on detached render inputs, without changing the recorded simulation.
const snapshots=[live.slice()];
const totalTicks=bytes[22]|bytes[23]<<8;assert.equal(bytes.length,0x722+totalTicks,'Complete canonical recording required');
for(let tick=1;tick<=totalTicks;tick++){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+tick-1],framesPerSecond);
 race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 if(tick===1||tick%50===0||tick===totalTicks)snapshots.push(race.session.state.memory.slice());
}
assert.equal(race.session.state.player.driving.car.grip.crash,3,'Completed reference must reach its finish');
const beforeRendering=live.slice(),snapshotChecks=snapshots.map(memory=>memory.slice());
for(const mode of ['cga','tandy','ega'] as const){
 const initial=decodeNativeInitialDisplayData(packet.modes[mode]),data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond};
 const direct=await prepareNativeDisplayRace(data,mode,initial,live,race.raw),copied=await prepareNativeDisplayRace(data,mode,initial,live,race.raw);
 if(mode==='ega')for(const result of [direct,copied]){
  // Explicitly allocate the non-page-flipped window; a page-flipping match
  // cannot prove the newly added EGA copy path was executed.
  const {owner}=result,allocated=allocateOriginalDisplayWindow(owner.memory(),owner.d,'ega',320,200);assert.equal(allocated.error,null);assert.ok(allocated.window);owner.writeMemory(allocated.memory);
  const view=new DataView(owner.memory().buffer);view.setUint16(owner.d+0x933a+0x45c,allocated.window.offset,true);view.setUint16(owner.d+0x933c+0x45c,allocated.window.segment,true);owner.memory()[owner.d+0xaa46+0x45c]=0;
 }
 const copy=createNativeDisplayRaceRenderer(copied.owner,race.raw,data.objects,data.planes,undefined,{physicsEngine:'ms-1991',framesPerSecond,experimentalMs91WindowCopy:true,experimentalMs91RegionFlags:true,experimentalMs91SelectiveCopy:selective,experimentalMs91PartialBackground:selective,experimentalMs91SlowVideoManagement:video==='slow'});
 let selectiveFrames=0;
 for(let frame=0;frame<snapshots.length;frame++){
  const a=snapshots[frame].slice(),b=snapshots[frame].slice();a[0x2d1a0+0x12f]=b[0x2d1a0+0x12f]=camera;prepareOriginalRaceViewport(a,0x2d1a0,0xeefe);prepareOriginalRaceViewport(b,0x2d1a0,0xeefe);
  if(status!==undefined)for(const input of [a,b])input[0x2d1a0+0x8ce9]=input[0x2d1a0+0x8da1]=status;
  // Simulation snapshots were produced without rendering. Do not keep
  // re-requesting their unconsumed startup redraw on every sampled frame.
  a[0x2d1a0+0x9ab6]=b[0x2d1a0+0x9ab6]=frame===0?1:0;
  const actual=copy.render(b),expected=direct.renderer.render(a),differences=Array.from(actual.keys()).filter(i=>actual[i]!==expected[i]);
  if(selective)assert.ok(copy.experimentalRepaintDiagnostics,'Selective copy path must actually execute in '+mode);
  if(copy.experimentalRepaintDiagnostics&&!copy.experimentalRepaintDiagnostics.fullRedraw)selectiveFrames++;
  assert.equal(differences.length,0,`${mode} moving sample ${frame}: ${differences.length} differing pixels; first ${differences.slice(0,8).map(i=>`${i%320},${Math.floor(i/320)}:${actual[i]}/${expected[i]}`).join(' ')}; plan ${JSON.stringify(copy.experimentalRepaintDiagnostics)}`);
 }
 if(selective)assert.ok(selectiveFrames>0,'Non-full-redraw presentation must execute in '+mode);
 if(selective)assert.ok(copy.experimentalPartialBackgroundPasses>0,'Partial background selector must execute in '+mode);
 if(video==='fast'&&status===1&&camera!==0)assert.ok(copy.experimentalLocalCarRegionSubmissions>0,'Fast-video status1 local car-region branch must execute in '+mode);
 assert.ok(copy.experimentalRenderWindowCaptures>0&&copy.experimentalRenderWindowCaptures<snapshots.length,'Ordinary frames must retain the allocated window instead of recapturing every frame');
 console.log(mode+' detail'+graphics+' camera'+camera+': diagnostic '+(selective?'selective':'viewport')+' window rendering matches direct pixels over '+snapshots.length+' samples through all'+totalTicks+' replay ticks and finish; rolled partial passes:'+copy.experimentalRolledBackgroundPasses);
}
assert.deepEqual(live,beforeRendering,'Rendering must not change the intentionally advanced simulation');
snapshots.forEach((memory,index)=>assert.deepEqual(memory,snapshotChecks[index],'Source sample preserved'));
assert.deepEqual(readFileSync(path),source);
