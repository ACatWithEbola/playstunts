/** Provenance and preservation only; not audible timing/loop acceptance. */
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=realpathSync(process.argv[2]),read=p=>JSON.parse(readFileSync(p));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const m=read(join(root,'manifest.json'));
assert.equal(m.actualSunoRecordingsOnly,true);assert.equal(m.reconstructedMusicAllowed,false);assert.equal(m.originalMusicModified,false);assert.equal(m.approvedForGame,false);
const sources={titl:'01 - Opening and Title - Suno.wav',slct:'02 - Menu and Selection - Suno.wav',vict:'03 - Victory - Suno.wav',over:'04 - Game Over - Suno.wav'};
for(const [name,file] of Object.entries(sources))assert.equal(hash(join(m.sourceRoot,file)),m.sourceHashes[name],'Original Suno export changed');
const required=['titl','slct','vict','over','over-rest','titl-three-cycle','vict-three-cycle','slct-three-cycle','over-three-cycle','titl-loop'];
assert.deepEqual(m.steps.map(step=>step.name).sort(),required.sort());
for(const step of m.steps){
 const output=resolve(root,step.outputPath??step.name+'.wav');assert.ok(output.startsWith(root+'/'));
 assert.equal(hash(output),step.sha256,'Timing-only output changed: '+step.name);
 if(step.input){const input=realpathSync(step.input);assert.ok(input.startsWith(root+'/')||Object.values(sources).some(file=>input===realpathSync(join(m.sourceRoot,file))),'Unexpected non-Suno input');}
}
const seam=read(join(root,'title-loop/manifest.json'));
assert.equal(seam.kind,'loop-context-crossfade');assert.equal(seam.durationChanged,false);assert.equal(seam.originalMidiModified,false);assert.equal(seam.fadeFrames,192);
assert.equal(realpathSync(seam.source),join(root,'titl-three-cycle.wav'));
const before=readFileSync(seam.source),after=readFileSync(join(root,'title-loop/loop-seam-trial.wav'));
assert.equal(hash(seam.source),seam.sourceSha256);assert.equal(hash(join(root,'title-loop/loop-seam-trial.wav')),seam.outputSha256);assert.equal(before.length,after.length);
let data=0;
for(let at=12;at+8<=before.length;){const size=before.readUInt32LE(at+4);if(before.toString('ascii',at,at+4)==='data'){data=at+8;break;}at+=8+size+(size&1);}
assert.ok(data>0);
const low=data+seam.firstEditedFrame*8,high=data+(seam.lastEditedFrame+1)*8;
assert.deepEqual(after.subarray(0,low),before.subarray(0,low));assert.deepEqual(after.subarray(high),before.subarray(high));
let changed=0;for(let at=low;at<high;at+=4){const value=after.readFloatLE(at);assert.ok(Number.isFinite(value)&&Math.abs(value)<1);if(value!==before.readFloatLE(at))changed++;}
assert.ok(changed>0&&changed<=(192+2)*2);
console.log(JSON.stringify({originalSunoFilesVerified:4,outputChecksumsVerified:m.steps.length,titleChangedSamples:changed,outsideTitleJoinExact:true,durationChanged:false,originalMusicModified:false,audibleAcceptance:false}));
