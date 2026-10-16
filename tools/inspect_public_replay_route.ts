/** Read-only route trace of a downloaded public recording; no classification writes. */
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
import {createShortcutAssessment} from '../lib/server/shortcut-assessment.ts';
const path=process.argv[2];if(!path)throw Error('Provide replay path');
const bytes=decodeVersionedReplay(readFileSync(path),'ms-1991').bytes;
const data=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond:20 as const});
const track=Array.from(bytes.slice(24,0x722));
const route=prepareRaceTrack(track,data.records,data.vectors,data.samples,data.objects);
const check=createShortcutAssessment(route.graph);
const race=await createNativeManualRaceSession(data,{configuration:Array.from(bytes.slice(0,24)),track,name:'REVIEW',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
let tick=0,last='',segment:any=null;const segments:any[]=[];
for(const input of bytes.slice(0x722)){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input,20,'ms-1991');
 race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});tick++;
 const c=race.session.state.player.driving.car,p=c.pose.position;
 const x=Math.floor(p[0]/65536),y=29-Math.floor(p[2]/65536),surfaces=[...c.grip.surfaces];
 const nodes=route.graph.columns.flatMap((col,i)=>col===x&&route.graph.rows[i]===y?[i]:[]);
 const key=JSON.stringify([x,y,surfaces]);
 if(key!==last){segment={from:tick/20,to:tick/20,x,y,tile:track[y*30+x],nodes,surfaces,position:p.map(v=>Math.round(v/64)),height:Math.round(p[1]/64)};segments.push(segment);last=key;}else segment.to=tick/20;
 if(!race.session.state.done)check.observe(p,surfaces);
}
console.log(JSON.stringify({path,time:readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel.playerTime/20,assessment:check.result(),reason:check.reason(),graph:route.graph,segments},null,2));
