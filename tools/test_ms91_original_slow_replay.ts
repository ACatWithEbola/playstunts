import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay,encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession,createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {runAllocatedRaceResults} from '../lib/game/native-allocated-race-results.ts';
import {writeMs91ResultTimeFields} from '../lib/game/race-result-time-scratch.ts';
import {sharedScoreFile,scoreString} from '../lib/game/global-score-format.ts';
import {enterNativeHighScoreWithPresentation} from '../lib/game/native-high-score-runtime.ts';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {createGlobalScoreFileStore} from '../lib/game/global-score-file-store.ts';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
import {originalHighScoreRow} from '../lib/game/high-score-format.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';

const path=process.argv[2];
if(!path)throw Error('Pass an original MS91 10 Hz replay path; this check must not silently skip');
const source=new Uint8Array(readFileSync(path)),before=source.slice();
const decoded=decodeVersionedReplay(source,'ms-1991');
assert.equal(decoded.framesPerSecond,10,'Reference must actually be a slower-speed recording');
const bytes=decoded.bytes;
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SLOWREF',camera:0,graphics:2,soundEnabled:false};
const data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond:10 as const,experimental10Hz:true};
const live=await createNativeManualRaceSession(data,menu,{resetMouse(){}});
live.session.skipIntroduction();
for(const input of bytes.slice(0x722)){
 assert.ok(captureOriginalRaceInput(live.session.state.memory,0x2d1a0,input,10).recorded);
 live.session.originalMemory.writeMemory(live.session.state.memory);
 live.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
}
const panel=readOriginalRaceResultMemory(live.session.state.memory,0x2d1a0).panel;
assert.ok(panel.playerTime>0,'The original slower recording must finish in a fresh local race');
let saved:Uint8Array|undefined;
await live.session.saveReplay(async recording=>{saved=recording.slice();return 0;});
assert.ok(saved);
assert.deepEqual(saved.slice(0,22),bytes.slice(0,22));
assert.deepEqual(saved.slice(0x722),bytes.slice(0x722,0x722+saved.length-0x722));
const restored=decodeVersionedReplay(encodeVersionedReplay(saved,'ms-1991',10),'ms-1991');
assert.equal(restored.framesPerSecond,10);assert.deepEqual(restored.bytes,saved);
const loaded=await createNativeReplayRaceSession(data,menu,{bytes:restored.bytes,name:'SLOWREF',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:10},{resetMouse(){},async key(){return 0;}});
loaded.session.seek(0);loaded.session.seek(loaded.session.length);
const car=(memory:Uint8Array)=>readRecordedTwoCarRace(memory,0x2d1a0).player.driving.car;
assert.deepEqual(car(loaded.session.state.memory),car(live.session.state.memory));
// Viewing/seek is deliberately not a newly completed eligible race. Car state
// must reproduce the finish, but result scratch/score eligibility must not.
assert.equal(readOriginalRaceResultMemory(loaded.session.state.memory,0x2d1a0).panel.flags,4);
let presented=false,writes=0,board=sharedScoreFile([]);
const stored=new Map<string,NativeStoredFile>();
const persistence={async all(){return structuredClone([...stored.values()]);},async put(file:NativeStoredFile){stored.set(file.key,structuredClone(file));}};
const local=await createNativeFileStore(new Map(),persistence);
await local.write('C:\\','SLOWREF','.RPL',saved,'ms-1991',10);
await local.write('C:\\','SLOWREF','.TRK',bytes.slice(24,0x722));
const legacy=sharedScoreFile([]),normal=sharedScoreFile([]);normal[0]=78;
await local.write('C:\\','SLOWREF','.HIG',legacy);
await local.write('C:\\','SLOWREF','.M91',normal,'ms-1991');
const shared={async retainedRecords(){throw Error('Slower results must not restore20 Hz proofs');},close(){}} as unknown as Parameters<typeof createGlobalScoreFileStore>[1];
const scoreFiles=createGlobalScoreFileStore(local,shared,()=>undefined,()=>live.session.physicsEngine,()=>live.session.framesPerSecond);
await runAllocatedRaceResults(data,live,{
 progress(){},
 async readFile(filename){
  if(/\.TRK$/i.test(filename))return bytes.slice(24,0x722);
  if(/\.HIG$/i.test(filename))return scoreFiles.read('C:\\','SLOWREF','.HIG');
  throw Error('Unexpected slow-result read '+filename);
 },
 async writeFile(filename,next){assert.match(filename,/\.HIG$/i);board=next.slice();await scoreFiles.write('C:\\','SLOWREF','.HIG',next);writes++;return 0;},
 async insertTrackDisk(){return 0;},
 async present(state,services){
  presented=true;
  assert.equal(state.panel.physicsEngine,'ms-1991');
  assert.equal(state.panel.framesPerSecond,10);
  assert.equal(state.panel.playerTime,panel.playerTime);
  const expected=live.session.state.memory.slice();
  writeMs91ResultTimeFields(expected,0x2d1a0,0xeefe,state.panel.playerTime-state.panel.penaltyTime,10);
  assert.deepEqual(live.session.state.memory,expected,'Slow result formatter retains cadence-aware fields');
  const eligibility=await services.prepareScores!(state);
  assert.equal(eligibility.status,1);
  assert.equal(eligibility.candidateTime,panel.playerTime);
  await enterNativeHighScoreWithPresentation({drawTable(){},present(){},async editName(){return 'SLOW QA';},async save(next){assert.ok(await services.files.writeScores(next));}},state.scores,{time:eligibility.candidateTime,classification:0,carName:state.carName,opponentSelected:state.panel.opponentSelected,opponentCode:state.opponentCode,opponentCarCode:state.opponentCarCode},[],4);
  return 2;
 }
});
assert.ok(presented);assert.equal(writes,1);assert.equal(scoreString(board.slice(0,52),0,17),'SLOW QA');
assert.deepEqual(await local.read('C:\\','SLOWREF','.HIG'),legacy);
assert.deepEqual(await local.read('C:\\','SLOWREF','.M91'),normal);
assert.deepEqual(await local.read('C:\\','SLOWREF','.M10'),board);
assert.equal(String.fromCharCode(...originalHighScoreRow(Array.from(board.slice(0,52)),{physicsEngine:live.session.physicsEngine,framesPerSecond:live.session.framesPerSecond}).fields[3]),' 1:34.80');
const backup=decodeSaveBackup(encodeSaveBackup(await persistence.all(),'C:\\'));
const reopened=await createNativeFileStore(new Map(),{async all(){return backup.files;},async put(){throw Error('Reopened backup must not write');}});
assert.deepEqual(await reopened.read('C:\\','SLOWREF','.M10'),board);
assert.equal(reopened.framesPerSecond('C:\\','SLOWREF','.M10'),10);
assert.deepEqual(await reopened.read('C:\\','SLOWREF','.M91'),normal);
assert.deepEqual(await reopened.read('C:\\','SLOWREF','.HIG'),legacy);
const savedKey='C:\\SLOWREF.RPL';
const backedReplay=backup.files.find(file=>file.key===savedKey);
assert.ok(backedReplay,'Completed slow replay must survive the actual file-store backup');
assert.equal(backedReplay.physicsEngine,'ms-1991');assert.equal(backedReplay.framesPerSecond,10);
assert.deepEqual(backedReplay.bytes,saved,'Backup retains canonical captured input bytes');
const canonicalBefore=backedReplay.bytes.slice();
const download=nativeFileDownload(backedReplay);
assert.equal(new DataView(download.buffer,download.byteOffset,download.byteLength).getUint16(22,true),10);
const imported=decodeVersionedReplay(download,'ms-1991');
assert.equal(imported.framesPerSecond,10);assert.deepEqual(imported.bytes,saved);
assert.deepEqual(backedReplay.bytes,canonicalBefore,'Download cannot mutate restored canonical storage');
// A legacy default must not reinterpret a versioned downloaded recording.
const downloadedRace=await createNativeReplayRaceSession({...data,physicsEngine:'ms-1990',framesPerSecond:20},menu,{bytes:imported.bytes,name:'SLOWREF',path:'C:\\',physicsEngine:backedReplay.physicsEngine,framesPerSecond:imported.framesPerSecond},{resetMouse(){},async key(){return 0;}});
assert.equal(downloadedRace.session.physicsEngine,'ms-1991');assert.equal(downloadedRace.session.framesPerSecond,10);
downloadedRace.session.seek(0);downloadedRace.session.seek(downloadedRace.session.length);
assert.deepEqual(car(downloadedRace.session.state.memory),car(live.session.state.memory));
assert.equal(readOriginalRaceResultMemory(downloadedRace.session.state.memory,0x2d1a0).panel.flags,4,'Downloaded playback cannot become a new eligible score');
assert.deepEqual(new Uint8Array(readFileSync(path)),before);
console.log(JSON.stringify({reference:path,frames:bytes.length-0x722,savedFrames:saved.length-0x722,rate:10,finishTicks:panel.playerTime,replayEligibility:4,sourceUnchanged:true}));
