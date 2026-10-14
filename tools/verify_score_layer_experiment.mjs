/** Verify candidate decomposition/provenance, NOT every note in the mixed song. */
import {readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const directory=process.argv[2];if(!directory||!isAbsolute(directory))throw Error('Provide absolute experiment directory');
const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
assert.equal(manifest.approvedForGame,false);assert.equal(manifest.individualNotesVerified,false);
assert.equal(manifest.subtractionBeforeTempo,true);
for(const input of manifest.inputs)assert.equal(createHash('sha256').update(readFileSync(input.path)).digest('hex'),input.sha256,'Input provenance changed');
const wav=name=>{
 const b=readFileSync(join(directory,name+'.wav'));
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,16),'WAVEfmt ');
 assert.equal(b.readUInt16LE(20),3);assert.equal(b.readUInt16LE(22),2);
 assert.equal(b.readUInt32LE(24),manifest.rate);assert.equal(b.readUInt16LE(34),32);
 assert.equal(b.toString('ascii',36,40),'data');assert.equal(b.length,44+manifest.frames*8);
 return b;
};
const residual=wav('residual'),scored=wav('scored-layer'),candidate=wav('score-layer-candidate');
// Independently decode unshifted original references. Algebra alone would
// accept a candidate and scored layer shifted together by the same amount.
const reference=index=>execFileSync('ffmpeg',['-v','error','-i',manifest.inputs[index].path,'-t',String(manifest.seconds),'-ar',String(manifest.rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});
const chord=reference(2),bass=manifest.inputs.length===5?reference(4):null;
assert.equal(chord.length,manifest.frames*8);if(bass)assert.equal(bass.length,chord.length);
let originalReferenceError=0;
for(let offset=0;offset<chord.length;offset+=4){
 const expected=chord.readFloatLE(offset)*manifest.referenceGain+(bass?bass.readFloatLE(offset)*manifest.bassReferenceGain:0);
 originalReferenceError=Math.max(originalReferenceError,Math.abs(scored.readFloatLE(44+offset)-expected));
}
assert.ok(originalReferenceError<1e-6,'Scored layer differs from original reference timing/samples');
let error=0,peak=0;
for(let offset=44;offset<candidate.length;offset+=4){
 const value=candidate.readFloatLE(offset),a=residual.readFloatLE(offset),b=scored.readFloatLE(offset);
 assert.ok(Number.isFinite(value)&&Number.isFinite(a)&&Number.isFinite(b));
 error=Math.max(error,Math.abs(value-a-b));peak=Math.max(peak,Math.abs(value));
}
assert.ok(error<1e-6);assert.ok(peak<1);
console.log(JSON.stringify({directory,frames:manifest.frames,componentSumMaxError:error,originalReferenceMaxError:originalReferenceError,originalReferenceSamplesVerified:true,peak,sourceHashesVerified:true,individualNotesVerified:false,audibleFidelityVerified:false}));
