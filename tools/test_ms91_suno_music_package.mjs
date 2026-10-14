import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ms91SunoMusic} from '../lib/game/ms91-suno-music.ts';
import {preloadRemixedMusicFiles} from '../lib/game/remixed-music.ts';
for(const edition of ['ms-1990','bb-1990','bb-1991','unknown',''])assert.equal(ms91SunoMusic(edition),undefined);
const profile=ms91SunoMusic('ms-1991');
const root=new URL('../public'+profile.paths.titl.replace(/[^/]+$/,''),import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('provenance.json',root)));
assert.equal(manifest.originalMusicModified,false);
assert.equal(manifest.legacyMusicModified,false);
assert.equal(manifest.files.length,4);
assert.deepEqual(manifest.files.map(file=>file.score).sort(),['over','slct','titl','vict'],'Each required song must occur exactly once');
const approval=JSON.parse(readFileSync(new URL('./ms91-suno-loop-approval.json',import.meta.url)));
assert.equal(manifest.loopListeningApproved,manifest.files.every(file=>approval.approvedSourceHashes[file.score]===file.sourceSha256));
assert.equal(manifest.loopListeningApproved,true,'Release package must use the source recordings whose loops were approved');
for(const item of manifest.files){
 assert.equal(profile.paths[item.score],profile.paths.titl.replace(/[^/]+$/,'')+item.file);
 assert.deepEqual(profile.timing[item.score],item.timing);
 assert.equal(item.actualSunoRecording,true);assert.equal(item.reconstructed,false);
 const file=new URL(item.file,root),bytes=readFileSync(file);
 assert.equal(bytes.length,item.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
 const decoded=spawnSync('ffmpeg',['-v','error','-i',file.pathname,'-f','f32le','-acodec','pcm_f32le','-'],{maxBuffer:100*1024*1024});
 assert.equal(decoded.status,0,decoded.stderr?.toString());
 assert.equal(decoded.stdout.length/8,item.decodedFrames);
 assert.ok(item.decodedFrames/item.rate>item.timing.introDuration+item.timing.loopDuration,'Loop endpoint remains inside decoded audio');
}
console.log('Four actual-Suno MS91 packages verified: hashes, decoded lengths, loop bounds and legacy edition isolation');
const originalFetch=globalThis.fetch;
try{
 let cache;
 globalThis.fetch=async(_url,options)=>{cache=options.cache;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
 await preloadRemixedMusicFiles(['over'],profile.paths);assert.equal(cache,'no-cache','Versioned assets must revalidate cached failures');
 await preloadRemixedMusicFiles(['titl']);assert.equal(cache,'force-cache','Legacy cache policy remains unchanged');
}finally{globalThis.fetch=originalFetch;}
