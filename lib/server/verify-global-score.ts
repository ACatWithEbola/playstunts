import {createNativeManualRaceSession} from '../game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../game/race-result-memory.ts';
import {canonicalScoreRecord,scoreHash,scoreTicks,validateScoreSubmission,MAX_RANKED_FRAMES} from '../game/global-score-format.ts';
import type {NativeDemoData} from '../game/native-demo-runtime.ts';
import {validateReplayEncoding} from '../game/upload-validation.ts';
import {prepareRaceTrack} from '../game/prepare-race-track.ts';
import {createShortcutAssessment} from './shortcut-assessment.ts';
import {createFullRouteWitness} from './full-route-witness.ts';
import {routeEvidenceGates} from './route-evidence-gates.ts';
import {createGrassSpeedExploit} from './grass-speed-exploit.ts';

/** Re-run the original inputs with server-owned car/track physics. A claimed
 * time alone, a crashed replay or a different car cannot enter the board. */
export async function verifyGlobalScore(value:unknown,data:NativeDemoData){
 const submission=validateScoreSubmission(value),replay=Uint8Array.from(submission.replay);
 validateReplayEncoding(replay,MAX_RANKED_FRAMES);
 const configuration=Array.from(replay.slice(0,24)),track=Array.from(replay.slice(24,0x722));
 const carCode=String.fromCharCode(...configuration.slice(0,4)),car=data.cars.find(c=>c.id===carCode);
 if(!car||configuration[5]>1||configuration[6]>6)throw Error('Invalid race configuration');
 const prepared=await createNativeManualRaceSession(data,{configuration,track,name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}}),d=0x2d1a0;
 prepared.session.skipIntroduction();
 const preparedRoute=prepareRaceTrack(track,data.records,data.vectors,data.samples,data.objects),assessment=createShortcutAssessment(preparedRoute.graph);
 const gates=routeEvidenceGates(track,preparedRoute,data);
 const witness=createFullRouteWitness(preparedRoute.graph,gates);
 const grassExploit=createGrassSpeedExploit(car);
 let completedInputs=0;
 for(const input of replay.slice(0x722)){
  let result=captureOriginalRaceInput(prepared.session.state.memory,d,input);
  if(result.action==='continue-prompt'){prepared.session.resumeRecording(0);result=captureOriginalRaceInput(prepared.session.state.memory,d,input);}
  if(!result.recorded)throw Error('Invalid race recording length');
  prepared.session.originalMemory.writeMemory(prepared.session.state.memory);
  const beforeCar=prepared.session.state.player.driving.car;
  if(!prepared.session.state.done)grassExploit.observe(beforeCar.engine,beforeCar.grip.surfaces,input);
  prepared.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
  const carState=prepared.session.state.player.driving.car;
  if(!prepared.session.state.done){assessment.observe(carState.pose.position,carState.grip.surfaces);witness.observe(carState.pose.position,carState.grip.surfaces);}
  completedInputs++;if(prepared.session.state.player.driving.car.grip.crash===3)break;
 }
 const memory=prepared.session.state.memory;
 const {panel}=readOriginalRaceResultMemory(prepared.session.state.memory,0x2d1a0);
 if(!panel.playerTime||panel.playerTime!==scoreTicks(submission.record))throw Error('Replay does not verify the submitted finish time');
 let name='';for(let i=0;i<24&&memory[d+0x8a12+i];i++)name+=String.fromCharCode(memory[d+0x8a12+i]);
 const record=canonicalScoreRecord(submission.record,name);
 record[41]=configuration[6]&&panel.opponentTime&&panel.opponentTime<panel.playerTime?1:0;
 // Opponent metadata is derived from the configuration, not trusted text.
 record.fill(0,42,50);
 if(configuration[6]){record.set(memory.slice(d+0xaa74,d+0xaa76),42);record[44]=47;record.set(memory.slice(d+0x8019,d+0x801d),45);record[49]=0;}
 else record[42]=32;
 const canonicalReplay=replay.slice(0,0x722+completedInputs);new DataView(canonicalReplay.buffer).setUint16(22,completedInputs,true);canonicalReplay.fill(0,13,21);
 // The original result above decides whether this is an accepted finish.
 // Website-only checkpoints, grass duration and structure traversal cannot
 // add new disqualifications. Only the agreed detected exceptions affect
 // the label; geometric witness telemetry remains diagnostic, not a rule.
 const routeAssessment=assessment.result()==='shortcuts_detected'||grassExploit.result()?'shortcuts_detected':'full_route';
 const assessmentReason=grassExploit.result()?'grass_speed':assessment.reason()||'full_route';
 return {record,carCode,ticks:panel.playerTime,replay:canonicalReplay,routeAssessment,assessmentReason,routeEvidence:{gates:witness.progress(),fullRoute:witness.result(!!panel.playerTime),grassUncertain:grassExploit.uncertain()},trackHash:await scoreHash(Uint8Array.from(track)),id:await scoreHash(Uint8Array.from([...canonicalReplay,...record]))};
}
