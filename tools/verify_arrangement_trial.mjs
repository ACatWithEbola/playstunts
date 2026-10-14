/** File provenance and exact PCM sum only; never listening/fidelity approval. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export function addPcm(sum,raw){
 assert.equal(raw.length,sum.length*4,'Wrong PCM length');
 for(let i=0;i<sum.length;i++){
  const value=raw.readFloatLE(i*4);assert.ok(Number.isFinite(value),'Nonfinite input');
  sum[i]=Math.fround(sum[i]+value);
 }
}
export function comparePcm(sum,raw){
 assert.equal(raw.length,sum.length*4,'Wrong output length');
 for(let i=0;i<sum.length;i++)assert.equal(raw.readFloatLE(i*4),sum[i],`Mixed sample mismatch at${i}`);
}
export function verifyTrial(directory){
 const m=JSON.parse(readFileSync(join(directory,'manifest.json'))),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
 assert.equal(m.rate,48000);assert.ok([60,100,200].includes(m.seconds));assert.equal(m.frames,m.seconds*48000);
 assert.ok(m.inputs.length>=2&&m.inputs.length<=16);assert.equal(m.normalizationApplied,false);assert.equal(m.approvedForGame,false);
 const pcm=p=>execFileSync('ffmpeg',['-v','error','-i',p,'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:128*1024*1024});
 const sum=new Float32Array(m.frames*2);
 for(const input of m.inputs){assert.equal(hash(input.path),input.sha256,'Input hash changed');addPcm(sum,pcm(input.path));}
 const output=join(directory,'arrangement-trial.wav');assert.equal(hash(output),m.outputSha256,'Output hash changed');
 const header=readFileSync(output).subarray(0,44);
 assert.equal(header.toString('ascii',8,12),'WAVE');assert.equal(header.readUInt16LE(20),3);assert.equal(header.readUInt16LE(22),2);
 assert.equal(header.readUInt32LE(24),48000);assert.equal(header.readUInt16LE(34),32);
 comparePcm(sum,pcm(output));
 let peak=0;for(const value of sum){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}
 assert.ok(peak<1);assert.equal(peak,m.peak);
 for(const input of m.inputs)assert.equal(hash(input.path),input.sha256,'Input changed during verification');
 return {inputs:m.inputs.length,frames:m.frames,peak,hashesMatch:true,exactPcmSum:true,audibleFidelityVerified:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyTrial(process.argv[2])));
