/** Verify exact additive assembly; never certify musical completeness. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const paths=process.argv.slice(2);assert.equal(paths.length,3,'Provide bass, lead and summed candidate');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),before=paths.map(hash);
const pcm=paths.map(path=>{
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels','-of','json',path],{encoding:'utf8'})).streams[0];
 assert.equal(Number(probe.sample_rate),48000);assert.equal(probe.channels,2);
 return execFileSync('ffmpeg',['-v','error','-i',path,'-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});
});
assert.equal(pcm[0].length,pcm[1].length);assert.equal(pcm[1].length,pcm[2].length);
let error=0,peak=0;
for(let index=0;index<pcm[2].length;index+=4){
 const sum=Math.fround(pcm[0].readFloatLE(index)+pcm[1].readFloatLE(index)),value=pcm[2].readFloatLE(index);
 assert.ok(Number.isFinite(sum)&&Number.isFinite(value));error=Math.max(error,Math.abs(sum-value));peak=Math.max(peak,Math.abs(value));
}
assert.ok(error<=1e-7);assert.ok(peak<1);assert.deepEqual(paths.map(hash),before);
console.log(JSON.stringify({frames:pcm[2].length/8,maxSumError:error,peak,sourceHashes:before,sourcesUnchanged:true,fullArrangementVerified:false,sunoCharacterApproved:false}));
