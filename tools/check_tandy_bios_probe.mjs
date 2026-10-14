import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const [mode,path]=process.argv.slice(2);
const expected={flat:[0,0,0,1,1],cross:[0,0,1,0,1],'flat-repeat':[0,0,1,1,2],'cross-repeat':[0,0,1,0,2],'back-to-back':[0,0,1,0,0],'back-to-back-volume7':[0,0,1,0,0],'back-to-back-divisor4095':[0,0,1,0,1]};
if(!Object.hasOwn(expected,mode)||!path)throw Error('Usage: node tools/check_tandy_bios_probe.mjs flat|cross|flat-repeat|cross-repeat|back-to-back absolute-TRACE.BIN');
const bytes=readFileSync(path);assert.equal(bytes.length,10,'Probe output must contain all five words');
const words=Array.from({length:5},(_,i)=>bytes.readUInt16LE(i*2));
assert.deepEqual(words,expected[mode],'Identified DOSBox0.83.0/Tandy/cpu5000 ordering must match captured reference');
console.log(`${mode}: captured ordering ${words.join(',')} verified; observed final completion count ${words[4]}. Ordering proof, not vintage latency or proof that rejected playback ran.`);
