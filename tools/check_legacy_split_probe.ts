import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const [image,libraries,path,format='ms-1991']=process.argv.slice(2);assert.ok(image&&libraries&&path);
assert.ok(format==='ms-1990'||format==='ms-1991');
const source=new Uint8Array(readFileSync(path)),{bytes}=decodeVersionedReplay(source,format);
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1990'},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SPLITPROBE',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();const memory=Buffer.from(race.session.state.memory).toString('base64'),inputs=Array.from(bytes.slice(0x722)),cars=[];
for(const input of inputs){captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});cars.push(Buffer.from(race.session.state.memory.slice(0x2d1a0+0x8c38,0x2d1a0+0x8c38+184)).toString('hex'));}
const statistics=Buffer.from(race.session.state.memory.slice(0x2d1a0+0x899a,0x2d1a0+0x899a+22)).toString('hex');
const run=spawnSync('python3',['tools/check_original_legacy_controlled_race.py',image,'--libraries',libraries],{input:JSON.stringify({memory,inputs,cars,statistics}),encoding:'utf8',maxBuffer:4000000});
assert.equal(run.status,0,run.stderr);console.log(run.stdout);assert.deepEqual(new Uint8Array(readFileSync(path)),source);
