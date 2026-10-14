import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=mkdtempSync(join(tmpdir(),'stunts-repeat-assembly-'));
const source=join(directory,'source.wav'),output=join(directory,'assembled.wav'),rate=8000;
const pcm=Buffer.alloc(rate*2*4);
for(let frame=0;frame<rate;frame++){
 pcm.writeFloatLE(Math.sin(frame*.07)*.2,frame*8);
 pcm.writeFloatLE(Math.cos(frame*.11)*.3,frame*8+4);
}
execFileSync('ffmpeg',['-v','error','-n','-f','f32le','-ar',String(rate),'-ac','2','-i','pipe:0','-c:a','pcm_f32le',source],{input:pcm});
const before=readFileSync(source);
const run=(destination,...args)=>execFileSync(process.execPath,['tools/assemble_remix_repeat.mjs',source,destination,...args.map(String)],{encoding:'utf8',stdio:['pipe','pipe','pipe']});
const report=JSON.parse(run(output,.3,.4,.7,3));
assert.equal(report.firstFrames,2400);assert.equal(report.steadyFrames,2400);
assert.equal(report.totalFrames,9600);assert.equal(report.decodedStereoSamplesPreserved,true);
assert.equal(report.scoreAlignmentVerified,false);assert.equal(report.audibleSeamVerified,false);
const actual=execFileSync('ffmpeg',['-v','error','-i',output,'-f','f32le','pipe:1']);
const cycle=pcm.subarray(3200*8,5600*8);
assert.deepEqual(actual,Buffer.concat([pcm.subarray(0,2400*8),cycle,cycle,cycle]));
const preservedOutput=readFileSync(output);
assert.throws(()=>run(output,.3,.4,.7,3));assert.deepEqual(readFileSync(output),preservedOutput);
assert.throws(()=>run(source,.3,.4,.7,3));assert.deepEqual(readFileSync(source),before);
for(const args of [[.3,.4,1.1,2],[.3,.7,.4,2],[.3,.4,.7,0],[.3,.4,.7,1.5],[NaN,.4,.7,2]]){
 const rejected=join(directory,'rejected-'+args.join('-')+'.wav');
 assert.throws(()=>run(rejected,...args));assert.equal(existsSync(rejected),false);
}
assert.deepEqual(readFileSync(source),before);
console.log(JSON.stringify({stereoSamplesAndOrderPreserved:true,exactFrameAssembly:true,invalidRangesRejected:true,overwritePrevented:true,scoreAlignmentVerified:false,pass:true}));
