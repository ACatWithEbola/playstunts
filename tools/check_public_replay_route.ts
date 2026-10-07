/** Read-only audit. Fetch an existing public score and replay, never submit it. */
import {fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {routeEvidenceGates} from '../lib/server/route-evidence-gates.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const [trackName,id]=process.argv.slice(2);
if(!trackName||!id||!/^[a-f0-9]{64}$/.test(id))throw Error('Usage: node tools/check_public_replay_route.ts TRACK SCORE_ID');
const directory=await fetch('https://playstunts.com/api/leaderboards?q='+encodeURIComponent(trackName));
if(!directory.ok)throw Error('Leaderboard unavailable');
const {boards}=await directory.json() as {boards:{cars:{scores:{id:string;driver:string;ticks:number}[]}[]}[]};
const score=boards.flatMap(b=>b.cars.flatMap(c=>c.scores)).find(s=>s.id===id);
if(!score)throw Error('Exact current score not found');
const response=await fetch('https://playstunts.com/api/replays?id='+id);
if(!response.ok)throw Error('Public replay unavailable');
const replay=new Uint8Array(await response.arrayBuffer()),record=Array(52).fill(0);
[...score.driver].forEach((c,i)=>record[i]=c.charCodeAt(0));record[50]=score.ticks&255;record[51]=score.ticks>>8;
const verified=await verifyGlobalScore({record,replay:Array.from(replay),rules:GLOBAL_SCORE_RULES,flags:1,continued:false},fixtureData);
if(verified.id!==id)throw Error('Canonical score mismatch; no association may be inferred');
const track=Array.from(replay.slice(24,0x722)),prepared=prepareRaceTrack(track,fixtureData.records,fixtureData.vectors,fixtureData.samples,fixtureData.objects),gates=routeEvidenceGates(track,prepared,fixtureData);
const incomplete=verified.routeEvidence.gates.filter(g=>g.covered>0&&g.covered<g.required).map(g=>({...g,row:prepared.graph.rows[g.node],column:prepared.graph.columns[g.node],primary:prepared.graph.primary[g.node],alternate:prepared.graph.alternate[g.node],gates:gates[g.node]}));
const race=await createNativeManualRaceSession(fixtureData,{configuration:Array.from(replay.slice(0,24)),track,name:'AUDIT',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});race.session.skipIntroduction();
const nearest=incomplete.map(g=>({...g,tile:prepared.route.tiles[g.node],physics:fixtureData.objects[prepared.route.tiles[g.node]].physics,gates:g.gates.map(gate=>({...gate,nearest:Infinity,frame:0,car:[] as number[],surfaces:[] as number[]}))}));let frame=0;
for(const input of replay.slice(0x722)){
 let captured=captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input);if(captured.action==='continue-prompt'){race.session.resumeRecording(0);captured=captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input);}
 race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});frame++;
 const car=race.session.state.player.driving.car,position=car.pose.position.map(n=>n/64);
 for(const group of nearest)for(const gate of group.gates){const distance=Math.hypot(...gate.position.map((n,i)=>position[i]-n));if(distance<gate.nearest){gate.nearest=distance;gate.frame=frame;gate.car=position;gate.surfaces=[...car.grip.surfaces];}}
}
console.log(JSON.stringify({id,driver:score.driver,ticks:verified.ticks,routeAssessment:verified.routeAssessment,fullRoute:verified.routeEvidence.fullRoute,grassUncertain:verified.routeEvidence.grassUncertain,incomplete:nearest.map(g=>({...g,gates:g.gates.filter((_,i)=>i>=g.covered)})),finish:race.session.state.player.driving.car.pose.position.map(n=>n/64),graph:prepared.graph.primary.map((next,node)=>({node,next,alternate:prepared.graph.alternate[node],row:prepared.graph.rows[node],column:prepared.graph.columns[node]})).filter(g=>g.next===0||g.alternate!==65535)},null,2));
