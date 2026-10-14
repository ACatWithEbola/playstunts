/** Short loop auditions from the actual Suno recordings, no synthesis. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,dirname,basename,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';
const destination=process.argv[2];
assert.ok(destination&&isAbsolute(destination)&&!existsSync(destination));
const target=join(realpathSync(dirname(destination)),basename(destination)),pub=realpathSync('public');
assert.ok(target!==pub&&!target.startsWith(pub+'/'));
const profile=browserMs91SunoScorePreview('ms-1991',{hostname:'localhost',search:'?preview-suno-score=1'});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
mkdirSync(target);const clips=[];
for(const [score,url] of Object.entries(profile.paths)){
 const source='/private/tmp/'+new URL(url).pathname.slice('/files/'.length),before=hash(source);
 assert.ok(source.includes('/ms91-remix-reproducible-20261013-19/')||source.includes('/ms91-suno-title-loop-20261014-44/'),'Only approved-scope actual Suno timing paths');
 const timing=profile.timing[score],start=timing.cueOffset+timing.introDuration,end=start+timing.loopDuration;
 const output=join(target,score+'-suno-loop.wav');
 const filter=`[0:a]asplit=2[a][b];[a]atrim=start=${end-2}:end=${end},asetpts=PTS-STARTPTS[tail];[b]atrim=start=${start}:end=${start+3},asetpts=PTS-STARTPTS[head];[tail][head]concat=n=2:v=0:a=1[out]`;
 execFileSync('ffmpeg',['-v','error','-n','-i',source,'-filter_complex',filter,'-map','[out]','-c:a','pcm_f32le',output]);
 const raw=execFileSync('ffmpeg',['-v','error','-i',output,'-f','f32le','pipe:1'],{maxBuffer:4*1024*1024});
 assert.ok(Math.abs(raw.length/8-5*48000)<=1,'Five seconds, subject to sample rounding');
 assert.equal(hash(source),before);
 clips.push({score,source,sourceSha256:before,output:basename(output),outputSha256:hash(output),loopStart:start,loopEnd:end,joinAtSeconds:2,actualSunoRecording:true,synthesisApplied:false,normalizationApplied:false,audibleJoinVerified:false});
}
writeFileSync(join(target,'manifest.json'),JSON.stringify({clips,scope:'Two seconds before loop wrap followed by three seconds from loop start; actual Suno recording only, sample-rounded crop, not browser resampling/listening approval'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination:target,clips:clips.length,actualSunoOnly:true,synthesisApplied:false,joinAtSeconds:2}));
