/** Compare reconstructed engine results against original MS91 routine output. */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {readCarEngine} from '../lib/physics/reference-state.ts';
import {stepEngine} from '../lib/physics/engine.ts';
const path=process.argv[2];if(!path)throw Error('Supply original engine oracle JSON');
const oracle=JSON.parse(readFileSync(path,'utf8')) as {routine:string;fps?:10|20;cases:{before:string;after:string;tuning:string;input:number}[]};
assert.equal(oracle.routine,'engine');
assert.ok(oracle.cases.length>0,'Empty original engine oracle cannot establish parity');
const fps=oracle.fps??20;
assert.ok(fps===10||fps===20,'Unsupported oracle simulation rate');
const decode=(hex:string)=>Uint8Array.from(Buffer.from(hex,'hex'));
// 1991 CARSTATE inserts 24 bytes after offset 0x8c. The common fixed-width
// engine fields before that point are unchanged; move only the trailing bank.
const engine=(hex:string)=>{const modern=decode(hex),legacy=new Uint8Array(0xb8);legacy.set(modern.slice(0,0x8c));legacy.set(modern.slice(0xa4,0xd0),0x8c);return readCarEngine(legacy);};
for(const [index,row] of oracle.cases.entries()){
 const t=decode(row.tuning),v=new DataView(t.buffer),u=(o:number)=>v.getUint16(o,true),s=(o:number)=>v.getInt16(o,true);
 const tuning={gears:t[0],mass:u(2),braking:u(4),idleRPM:u(6),downshiftRPM:u(8),upshiftRPM:u(10),maxRPM:u(12),gearRatios:Array.from({length:7},(_,i)=>u(14+i*2)),gearKnobPoints:Array.from({length:7},(_,i)=>[s(28+i*4),s(30+i*4)]),aeroResistance:s(56),idleTorque:t[58],torqueCurve:Array.from(t.slice(59,163))};
 assert.deepEqual(stepEngine(engine(row.before),tuning,row.input,fps,undefined,undefined,'ms-1991'),engine(row.after),'MS91 original engine mismatch at case '+index);
}
console.log(`Reconstructed MS91 engine matches ${oracle.cases.length} original routine outputs`);
