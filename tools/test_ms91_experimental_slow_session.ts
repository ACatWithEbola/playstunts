import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession,createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import {encodeVersionedReplay,decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
const source=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),before=source.slice();
const menu={configuration:Array.from(source.slice(0,24)),track:Array.from(source.slice(24,0x722)),name:'SLOWTEST',camera:0,graphics:2,soundEnabled:false};
menu.configuration[6]=1;menu.configuration.splice(7,4,...menu.configuration.slice(0,4));menu.configuration[11]=menu.configuration[4];menu.configuration[12]=1;
const data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond:10 as const,experimental10Hz:true};
const fresh=await createNativeManualRaceSession(data,menu,{resetMouse(){}});fresh.session.skipIntroduction();
assert.equal(fresh.session.framesPerSecond,10);
const frames=1200,targets=[1,299,300,301,599,600,601,899,900,901,frames];
const cars=(memory:Uint8Array)=>{const state=readRecordedTwoCarRace(memory,0x2d1a0);return {player:state.player.driving.car,opponent:state.opponent.car};};
const snapshots=new Map<number,ReturnType<typeof cars>>();
for(let frame=0;frame<frames;frame++){
 assert.ok(captureOriginalRaceInput(fresh.session.state.memory,0x2d1a0,1,10).recorded);
 fresh.session.originalMemory.writeMemory(fresh.session.state.memory);fresh.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 if(targets.includes(frame+1))snapshots.set(frame+1,structuredClone(cars(fresh.session.state.memory)));
}
let saved:Uint8Array|undefined;await fresh.session.saveReplay(async bytes=>{saved=bytes.slice();return 0;});assert.ok(saved);
assert.equal(saved.length,0x722+frames);
const decoded=decodeVersionedReplay(encodeVersionedReplay(saved,'ms-1991',10),'ms-1991');assert.equal(decoded.framesPerSecond,10);
const stored:NativeStoredFile[]=[],files=await createNativeFileStore(new Map(),{async all(){return [];},async put(file){stored.push(structuredClone(file));}});
await files.write('C:\\','SLOWTEST','.RPL',decoded.bytes,'ms-1991',decoded.framesPerSecond);
const backup=decodeSaveBackup(encodeSaveBackup(stored,'C:\\'));
const reopened=await createNativeFileStore(new Map(),{async all(){return backup.files;},async put(){throw Error('Reopen must not rewrite slower replay');}});
const recording={bytes:await reopened.read('C:\\','SLOWTEST','.RPL'),name:'SLOWTEST',path:'C:\\',physicsEngine:reopened.physicsEngine('C:\\','SLOWTEST','.RPL'),framesPerSecond:reopened.framesPerSecond('C:\\','SLOWTEST','.RPL')};
assert.equal(recording.framesPerSecond,10);assert.equal(recording.physicsEngine,'ms-1991');assert.deepEqual(recording.bytes,saved);
const downloaded=decodeVersionedReplay(nativeFileDownload(backup.files[0]),'ms-1991');
assert.equal(downloaded.framesPerSecond,10);assert.deepEqual(downloaded.bytes,saved,'MS91 download preserves the recorded cadence and canonical controls');
await assert.rejects(createNativeReplayRaceSession({...fixtureData,physicsEngine:'ms-1991'},menu,recording,{resetMouse(){},async key(){return 0;}}),/10 Hz sessions require/);
const loaded=await createNativeReplayRaceSession(data,menu,recording,{resetMouse(){},async key(){return 0;}});
for(const target of targets){
 loaded.session.seek(0);loaded.session.seek(target);
 assert.deepEqual(cars(loaded.session.state.memory),snapshots.get(target),'Slower replay restores both recorded cars at checkpoint-boundary frame '+target);
}
assert.deepEqual(source,before);
console.log('Explicit cadence-aware MS91 10Hz two-car save/reload/rewind matches live states across300/600/900 checkpoints; incomplete initialization remains blocked');
