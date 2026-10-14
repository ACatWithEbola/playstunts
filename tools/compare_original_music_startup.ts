import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows: {engine:string;name:string;device:string;tracks:number;timers:number[][];accumulator:number;interval:number}[]=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.equal(rows.length,32);
const expectedCases=new Set(['ms-1990','ms-1991'].flatMap(engine=>['TITL','SLCT','VICT','OVER'].flatMap(name=>['AD','PC','TD','MT'].map(device=>`${engine}/${name}/${device}`))));
const seenCases=new Set<string>();
for(const row of rows){
 const identity=`${row.engine}/${row.name}/${row.device}`;
 assert.ok(expectedCases.has(identity),`Unexpected original startup identity: ${identity}`);
 assert.ok(!seenCases.has(identity),`Duplicate startup case cannot replace missing coverage: ${identity}`);
 seenCases.add(identity);
 assert.equal(row.timers.length,row.tracks,`${identity}: capture must contain every active timer`);
 for(const timer of row.timers)assert.equal(timer.length,row.engine==='ms-1991'?76:72,`${identity}: complete original timer record required`);
}
assert.deepEqual(seenCases,expectedCases,'Original startup capture must cover both engines, all four scores and all four devices');
// Compare only fields written by the actual initializer. Reset-retained fields,
// callbacks, internal reserved timer and real driver state have separate owners.
const fields=[0,1,2,3,4,5,6,7,8,0x15,0x16,0x18,0x19,0x1a,0x1b,0x1c,0x1e,0x1f,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2e,0x2f,0x30,0x31,0x32,0x47];
let timers=0,resetTimers=0;
for(const row of rows){
 const prefix:Record<string,string>={AD:'',PC:'pc-',TD:'tandy-',MT:'mt32-'};
 const path=`public/game/${prefix[row.device]}music-${row.name.toLowerCase()}-seed.json`,source=readFileSync(path),seed=JSON.parse(source.toString());
 assert.equal(row.tracks,seed.bank[seed.header+7+seed.bank[seed.header+6]*4]);
 assert.equal(row.accumulator,0);assert.equal(row.interval,128);
 for(let owner=0;owner<row.tracks;owner++){
  for(const at of fields)assert.equal(row.timers[owner][at],seed.timers[owner][at],`${row.engine} ${row.device} ${row.name} timer${owner} field${at.toString(16)}`);
  if(row.engine==='ms-1991')assert.deepEqual(row.timers[owner].slice(72),[0,0,0,0]);
  timers++;
 }
 if('allTimers' in row){
  const captured=row as typeof row & {actualTimerResetExecuted:boolean;allTimers:number[][]};
  assert.equal(captured.actualTimerResetExecuted,true);
  assert.equal(captured.allTimers.length,24);
  for(let owner=0;owner<24;owner++){
   const callbackOwned:boolean=owner<row.tracks||(owner===6&&row.tracks<7);
   const excluded:Set<number>=new Set<number>(callbackOwned?[51,52,53,54,67]:[]);
   // Native seeds install callbacks and the reserved driver timer separately.
   // This original reset/start capture intentionally has no installed driver.
   if(owner===6&&row.tracks<7)for(const at of [5,6,7,8,46,47,48,49])excluded.add(at);
   const timer=captured.allTimers[owner];
   assert.equal(timer.length,row.engine==='ms-1991'?76:72);
   for(let at=0;at<72;at++)if(!excluded.has(at))assert.equal(timer[at],seed.timers[owner][at],`${row.engine}/${row.device}/${row.name}: reset/start timer${owner} retained field${at}`);
   if(row.engine==='ms-1991')assert.deepEqual(timer.slice(72),[0,0,0,0]);
   resetTimers++;
  }
 }
 assert.deepEqual(readFileSync(path),source);
}
console.log(JSON.stringify({startupCases:rows.length,actualMusicTimersCompared:timers,actualResetTimersCompared:resetTimers,initializerFieldsPerTimer:fields.length,driverAndCallbacksNotInferred:true,seedFilesUnchanged:true,pass:true}));
