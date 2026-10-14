/** Direct original chassis comparison, isolated stationary Countach case. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {trackContact} from '../lib/physics/track-contact.ts';
import {reconstructPose} from '../lib/physics/chassis.ts';
import {stepTrack} from '../lib/physics/track-step.ts';
import {readCarEngine,readCarGrip,readCarSuspension} from '../lib/physics/reference-state.ts';
import type {Vector} from '../lib/physics/math.ts';
const [image,libraries,replay,game,car,speed='0',front='0',wheel='0',height='0',fall='0',input,steps='1',carState,inputStart='0',positionX='690432',positionZ='805760']=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game&&car);
const replaySource=readFileSync(replay);
const args=[new URL('./check_original_ms91_track_allocation.py',import.meta.url).pathname,image,'--libraries',libraries,'--replay',replay,'--game',game,'--analyze','--car',car,'--position',positionX,'0',positionZ,'--chassis-step'];
args.push('--road-speed',speed,'--front-angle',front,'--wheel-angle',wheel);
args[args.indexOf('--position')+2]=height;args.push('--fall-speed',fall);
if(input!==undefined){args.push('--driving-step',input==='recorded'?'0':input,'--driving-steps',steps);if(input==='recorded')args.push('--recorded-inputs');}
if(carState)args.push('--car-state',carState,'--input-start',inputStart);
const run=spawnSync('python3',args,{encoding:'utf8',maxBuffer:2*1024*1024});assert.equal(run.status,0,run.stderr);
const original=JSON.parse(run.stdout),before=Uint8Array.from(Buffer.from(original.chassis.before,'hex')),after=Uint8Array.from(Buffer.from(original.chassis.after,'hex'));
const common=(bytes:Uint8Array)=>{const out=new Uint8Array(184);out.set(bytes.slice(0,140));out.set(bytes.slice(164,208),140);return out;};
const raw=common(before),v=new DataView(raw.buffer),engine=readCarEngine(raw),grip=readCarGrip(raw),suspension=readCarSuspension(raw);
const pose={position:[0,4,8].map(at=>v.getInt32(at,true)) as Vector,rotation:[24,26,28].map(at=>v.getInt16(at,true)) as Vector};
const tune=Uint8Array.from(Buffer.from(original.carInitialized.tuning??'', 'hex'));
assert.equal(tune.length,776,'Original tuning must be returned by harness');
const tv=new DataView(tune.buffer),wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>tv.getInt16(210+i*6+a*2,true)) as Vector);
const history=Array.from({length:4},(_,i)=>[0,1,2].map(a=>v.getInt16(0x74+i*6+a*2,true)) as Vector);
const track={raw:Array.from(replaySource.slice(26,1828)),objects:fixtureData.objects,planes:fixtureData.planes,walls:fixtureData.walls,physicsEngine:'ms-1991' as const,framesPerSecond:20 as const};
const bounds={dimensions:[0,1,2].map(a=>tv.getInt16(200+a*2,true)) as Vector,radius:tv.getInt16(206,true)};
const context=original.carInitialized.collisionContext;
const allocation=original.trackAnalysis.collisionAllocation;
const completeTrack={...track,signs:{cells:allocation.tileIndices,positions:allocation.centres as Vector[],broken:allocation.initialProcessedMarkers.slice()},landmarks:{...bounds,hillHeight:context.hillHeight},posts:{...bounds,column:context.column,terrainRow:context.terrainRow,height:context.height,heading:context.heading}};
let contact=trackContact({...pose,...grip,suspension:suspension.rc2,roadSpeed:engine.roadSpeed,physicsEngine:'ms-1991'},wheels,history,suspension,track,grip.crash,grip.soundFlags);
let actualPose=reconstructPose(contact.centres,'ms-1991');
let driving:ReturnType<typeof stepTrack>|undefined;
if(input!==undefined){
 const u=(o:number)=>tv.getUint16(o,true),s=(o:number)=>tv.getInt16(o,true);
 const tuning={gears:tune[0],mass:u(2),braking:u(4),idleRPM:u(6),downshiftRPM:u(8),upshiftRPM:u(10),maxRPM:u(12),gearRatios:Array.from({length:7},(_,i)=>u(14+i*2)),gearKnobPoints:Array.from({length:7},(_,i)=>[s(28+i*4),s(30+i*4)]),aeroResistance:s(56),idleTorque:tune[58],torqueCurve:Array.from(tune.slice(59,163)),grip:u(0xa4),surfaceGrip:Array.from({length:6},(_,i)=>u(0xb4+i*2))};
 const beforeView=new DataView(before.buffer,before.byteOffset,before.byteLength);
 let state={pose,engine,grip,suspension,wheelPositions:history,bodyPlaneCache:Array.from({length:4},(_,i)=>[0,1,2].map(a=>beforeView.getInt16(140+i*6+a*2,true)) as Vector)};
 assert.equal(original.chassis.sequence.length,Number(steps));
 for(const [frame,hex] of original.chassis.sequence.entries()){
  const control=original.chassis.inputs[frame];assert.ok(Number.isInteger(control)&&control>=0&&control<=255);
  if(input==='recorded')assert.equal(control,replaySource[0x724+Number(inputStart)+frame],'Recorded input differs');
  driving=stepTrack(state,tuning,wheels,control,completeTrack);
  if(driving.signImpact)completeTrack.signs.broken[driving.signImpact.index]=1;
  const expectedRaw=Uint8Array.from(Buffer.from(hex as string,'hex')),cv=common(expectedRaw),pv=new DataView(expectedRaw.buffer);
  assert.deepEqual(driving.pose.position,[0,4,8].map(at=>pv.getInt32(at,true)),'Sequential position at '+(frame+1));
  assert.deepEqual(driving.pose.rotation,[24,26,28].map(at=>pv.getInt16(at,true)),'Sequential rotation at '+(frame+1));
  assert.deepEqual(driving.engine,readCarEngine(cv),'Sequential engine at '+(frame+1));
  assert.deepEqual(driving.grip,readCarGrip(cv),'Sequential grip at '+(frame+1));
  if(carState)assert.equal(driving.grip.crash,0,'Controlled passage must remain crash-free at '+(frame+1));
  assert.deepEqual(driving.suspension,readCarSuspension(cv),'Sequential suspension at '+(frame+1));
  assert.deepEqual(driving.wheelPositions,Array.from({length:4},(_,i)=>[0,1,2].map(a=>pv.getInt16(0x74+i*6+a*2,true))),'Sequential wheels at '+(frame+1));
  assert.deepEqual(driving.bodyPlaneCache,Array.from({length:4},(_,i)=>[0,1,2].map(a=>pv.getInt16(140+i*6+a*2,true))),'Sequential body cache at '+(frame+1));
  state={...driving,wheelPositions:driving.wheelPositions!,bodyPlaneCache:driving.bodyPlaneCache!};
 }
 assert.ok(driving);
 assert.deepEqual(completeTrack.signs.broken,original.chassis.signMarkersAfter,'Original/native sign marker writes');
 console.log(JSON.stringify({signMarkers:completeTrack.signs.broken,lastSignImpact:driving.signImpact??null}));
 actualPose=driving.pose;
 contact={...contact,wheelPositions:driving.wheelPositions!,suspension:driving.suspension,surfaces:driving.grip.surfaces,crash:driving.grip.crash,soundFlags:driving.grip.soundFlags,wheelAngle:driving.grip.wheelAngle,roadSpeed:driving.engine.roadSpeed,passes:driving.contactPasses};
}
const av=new DataView(after.buffer),originalWheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>av.getInt16(0x74+i*6+a*2,true)));
console.log(JSON.stringify({actualPose,originalPosition:original.chassis.position,actualWheels:contact.wheelPositions,originalWheels,contactPasses:contact.passes}));
assert.deepEqual(actualPose.position,original.chassis.position);
assert.deepEqual(actualPose.rotation,original.chassis.rotation);
assert.deepEqual(contact.wheelPositions,originalWheels);
assert.equal(contact.crash,original.chassis.crash);
const afterCommon=common(after),afterGrip=readCarGrip(afterCommon),afterEngine=readCarEngine(afterCommon);
if(driving){assert.deepEqual(driving.engine,afterEngine,'Combined engine fields differ');assert.deepEqual(driving.grip,afterGrip,'Combined grip fields differ');}
assert.deepEqual(contact.suspension,readCarSuspension(afterCommon),'Suspension fields differ');
assert.deepEqual(contact.surfaces,afterGrip.surfaces,'Wheel surfaces differ');
assert.equal(contact.soundFlags,afterGrip.soundFlags,'Sound-request flags differ');
assert.equal(contact.wheelAngle,afterGrip.wheelAngle,'Retained wheel angle differs');
assert.equal(contact.roadSpeed,afterEngine.roadSpeed,'Collision-adjusted road speed differs');
if(fall==='23254'||fall==='23255'){
 const comparisons=original.chassis.landingTrace.filter((entry:{at:string})=>entry.at==='0x840a');
 assert.equal(comparisons.length,4,'All wheels must reach original landing comparison');
 assert.equal(comparisons[0].fallWord,Number(fall)+21,'Actual compared boundary word differs');
 const crashBranch=original.chassis.landingTrace.some((entry:{at:string})=>entry.at==='0x8411');
 assert.equal(crashBranch,fall==='23255','Original landing threshold branch differs');
 console.log(JSON.stringify({landingComparedWord:comparisons[0].fallWord,originalCrashBranch:crashBranch,crash:contact.crash}));
}
if(fall==='229'||fall==='230'){
 const comparisons=original.chassis.landingTrace.filter((entry:{at:string})=>entry.at==='0x83f5');
 assert.equal(comparisons.length,4,'All wheels must reach original landing sound comparison');
 assert.equal(comparisons[0].fallWord,Number(fall)+21);
 const soundBranch=original.chassis.landingTrace.some((entry:{at:string})=>entry.at==='0x83fc');
 assert.equal(soundBranch,fall==='230');
 assert.equal(!!(contact.soundFlags&32),soundBranch);
 console.log(JSON.stringify({landingSoundComparedWord:comparisons[0].fallWord,originalSoundBranch:soundBranch}));
}
assert.deepEqual(readFileSync(replay),replaySource);
console.log(JSON.stringify({physicalSteps:Number(steps),recordedControls:input==='recorded',sourceUnchanged:true,fullRaceVerified:false,pass:true}));
