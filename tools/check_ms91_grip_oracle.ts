import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {readCarGrip} from '../lib/physics/reference-state.ts';
import {stepGrip} from '../lib/physics/grip.ts';
const path=process.argv[2];if(!path)throw Error('Supply original grip oracle JSON');
const oracle=JSON.parse(readFileSync(path,'utf8')) as {routine:string;cases:{before:string;after:string;tuning:string;player:boolean}[]};
assert.equal(oracle.routine,'grip');
assert.ok(oracle.cases.length>0,'Empty original grip oracle cannot establish parity');
const decode=(hex:string)=>Uint8Array.from(Buffer.from(hex,'hex'));
const grip=(hex:string)=>{const modern=decode(hex),legacy=new Uint8Array(0xb8);legacy.set(modern.slice(0,0x8c));legacy.set(modern.slice(0xa4,0xd0),0x8c);return readCarGrip(legacy);};
for(const [index,row] of oracle.cases.entries()){
 const t=decode(row.tuning),v=new DataView(t.buffer);
 const tuning={grip:v.getUint16(0xa4,true),surfaceGrip:Array.from({length:6},(_,i)=>v.getUint16(0xb4+i*2,true))};
 assert.deepEqual(stepGrip(grip(row.before),tuning,row.player,0,undefined,'ms-1991'),grip(row.after),'MS91 original grip mismatch at case '+index);
}
console.log(`Reconstructed MS91 grip matches ${oracle.cases.length} original routine outputs`);
