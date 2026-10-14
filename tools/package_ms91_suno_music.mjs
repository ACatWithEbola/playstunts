/** Encode actual Suno timing edits for web delivery; no instrument synthesis. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {ms91SunoTiming} from '../lib/game/ms91-suno-music.ts';
const [build,destination]=process.argv.slice(2);
assert.ok(build&&destination&&isAbsolute(build)&&isAbsolute(destination)&&!existsSync(destination));
execFileSync(process.execPath,['tools/verify_ms91_actual_suno_build.mjs',build]);
const root=realpathSync(build),manifest=JSON.parse(readFileSync(join(root,'manifest.json')));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const approval=JSON.parse(readFileSync(new URL('./ms91-suno-loop-approval.json',import.meta.url)));
mkdirSync(destination);const files=[];
for(const [name,timing] of Object.entries(ms91SunoTiming)){
 const lossless=name==='over',filename=name+(lossless?'.wav':'.mp3');
 const source=join(root,name==='titl'?'title-loop/loop-seam-trial.wav':name+'-three-cycle.wav'),before=hash(source),output=join(destination,filename);
 // Retain context beyond the loop endpoint for encoder/decoder boundaries.
 const frames=Math.ceil((timing.introDuration+timing.loopDuration+.25)*48000);
 execFileSync('ffmpeg',['-v','error','-n','-i',source,'-af',`atrim=end_sample=${frames}`,'-ar','48000','-ac','2',...(lossless?['-c:a','pcm_f32le']:['-c:a','libmp3lame','-b:a','320k','-write_xing','1']),output]);
 const decoded=execFileSync('ffmpeg',['-v','error','-i',output,'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
 assert.equal(decoded.length,frames*8,'Gapless decode must retain exact trimmed sample count');
 if(lossless){
  const reference=execFileSync('ffmpeg',['-v','error','-i',source,'-af',`atrim=end_sample=${frames}`,'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
  assert.deepEqual(decoded,reference,'Lossless Game Over must preserve every approved sample');
 }
 assert.equal(hash(source),before);
 files.push({score:name,sourceSha256:before,file:filename,sha256:hash(output),bytes:readFileSync(output).length,decodedFrames:frames,rate:48000,bitrate:lossless?3072000:320000,lossless,timing,actualSunoRecording:true,reconstructed:false});
}
const loopListeningApproved=files.every(file=>approval.approvedSourceHashes[file.score]===file.sourceSha256);
writeFileSync(join(destination,'provenance.json'),JSON.stringify({sourceExportHashes:manifest.sourceHashes,files,originalMusicModified:false,legacyMusicModified:false,loopListeningApproved,loopListeningApprovalScope:approval.scope,encodedBrowserPlaybackVerified:false},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,files:files.length,totalBytes:files.reduce((sum,file)=>sum+file.bytes,0),exactDecodedSampleCounts:true,actualSunoOnly:true}));
