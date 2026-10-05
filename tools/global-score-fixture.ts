import {readFileSync} from 'node:fs';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const root=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name+'.json',root),'utf8'));
export const fixtureData={base:new Uint8Array(readFileSync(new URL('native-resource-base.bin',root))),catalog:createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(new URL('original-resources/'+file,root)))),cars:json('assets').cars,
 records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects:json('track-objects'),points:json('route-point-vectors'),indices:json('route-speed-indices'),planes:json('collision-planes'),walls:json('collision-walls').walls};
/** Drive a fresh native race, including the last approach absent from the
 * bundled CTKFIN replay. This is a generated result, not a forged score. */
export async function finishedScoreFixture(wait=0){
 const source=new Uint8Array(readFileSync(new URL('replays/CTKFIN.RPL',root))),replay=new Uint8Array(source.length+400+wait);replay.set(source.slice(0,0x722));replay.fill(2,0x722,0x722+wait);replay.set(source.slice(0x722),0x722+wait);replay.fill(1,source.length+wait);
 const runtime=await createNativeManualRaceSession(fixtureData,{configuration:Array.from(replay.slice(0,24)),track:Array.from(replay.slice(24,0x722)),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 runtime.session.skipIntroduction();
 for(const input of replay.slice(0x722)){let result=captureOriginalRaceInput(runtime.session.state.memory,0x2d1a0,input);if(result.action==='continue-prompt'){runtime.session.resumeRecording(0);result=captureOriginalRaceInput(runtime.session.state.memory,0x2d1a0,input);}if(!result.recorded)throw Error('Fixture input was not captured');runtime.session.originalMemory.writeMemory(runtime.session.state.memory);runtime.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});}
 const {panel}=readOriginalRaceResultMemory(runtime.session.state.memory,0x2d1a0);
 if(!panel.playerTime)throw Error('Generated native race did not finish');
 const record=Array(52).fill(0);record[50]=panel.playerTime&255;record[51]=panel.playerTime>>>8;record[0]=84;
 let saved:Uint8Array|undefined;await runtime.session.saveReplay(async bytes=>{saved=bytes;return 0;});
 const full=new Uint8Array(replay.length);full.set(saved!.slice(0,0x722));full.set(replay.slice(0x722),0x722);new DataView(full.buffer).setUint16(22,full.length-0x722,true);
 return {record,replay:Array.from(full),continued:false,flags:1,rules:GLOBAL_SCORE_RULES};
}
