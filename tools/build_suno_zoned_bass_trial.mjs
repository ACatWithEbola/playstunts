/** Bounded GameOver research, deliberately outside runtime assets. */
import {readFileSync,existsSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
import {renderZonedHarmonicBass} from './render_zoned_harmonic_bass.mjs';
const [manifestPath,destination,secondsText='10']=process.argv.slice(2);
const seconds=Number(secondsText);
if(![10,200].includes(seconds))throw Error('Require explicit10s or200s trial');
if(!manifestPath||!destination||existsSync(destination))throw Error('Require retained manifest and new output');
const publicRoot=realpathSync('public'),target=resolve(realpathSync(dirname(destination)),destination.split('/').pop());
if(target===publicRoot||target.startsWith(publicRoot+'/'))throw Error('Research cannot replace game assets');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const manifestHash=hash(manifestPath),base=JSON.parse(readFileSync(manifestPath));
if(base.channel!==2||base.layer!=='bass'||base.frames!==9600000||base.rate!==48000||base.approvedForGame!==false)throw Error('Require explicit retained200s GameOver bass trial');
const source=base.model.source,sourceHash=hash(source);
assert.equal(sourceHash,base.inputHashes[0]);assert.equal(sourceHash,base.model.sourceSha256);
const python='/private/tmp/playstunts-stem-env-20261013/bin/python';
const zones=[];
for(const [pitch,start,low,high] of [[28,3.76,41.1,41.4],[33,8.73,55,55.3],[38,5.77,73.4,73.7]]){
 const model=JSON.parse(execFileSync(python,['tools/analyze_bass_sample_harmonics.py',source,'--start',String(start),'--seconds','.21','--low',String(low),'--high',String(high),'--analysis-rate','8000','--step','.025','--harmonics','32'],{encoding:'utf8'}));
 if(model.model.residualEnergyFraction>.06)throw Error('Zone fails bounded source fit');
 // These source bass registers sit one octave below the captured score.
 // Offset selects timbre only; oscillator pitches always remain the score's.
 zones.push({pitch:pitch+12,sourceEstimatedMidi:pitch,sourceToScoreSelectionOffset:12,coefficients:model.model.stereoCoefficients,model});
}
const sourceRate=32000,rate=48000,frames=rate*seconds;
const notes=base.plan.notes.filter(note=>note.startFrame<seconds*sourceRate).map(note=>{
 const copy={...note};if(copy.releaseFrame>seconds*sourceRate){copy.releaseFrame=seconds*sourceRate;copy.windowTruncated=true;delete copy.retriggerAbortFrame;}return copy;
});
const candidate=renderZonedHarmonicBass(notes,zones,sourceRate,rate,frames);
const baseline=renderHarmonicBass(notes,base.model.model.stereoCoefficients,sourceRate,rate,frames);
assert.deepEqual(candidate.events,baseline.events);
function wav(pcm){
 const bytes=Buffer.alloc(44+pcm.length*4);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(3,20);bytes.writeUInt16LE(2,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*8,28);bytes.writeUInt16LE(8,32);bytes.writeUInt16LE(32,34);bytes.write('data',36);bytes.writeUInt32LE(pcm.length*4,40);pcm.forEach((value,i)=>bytes.writeFloatLE(value,44+i*4));return bytes;
}
assert.equal(hash(source),sourceHash);assert.equal(hash(manifestPath),manifestHash);
mkdirSync(target);
const outputHashes={};
for(const [name,rendered] of [['baseline',baseline],['zoned',candidate]]){
 const file=join(target,name+'.wav');writeFileSync(file,wav(rendered.pcm),{flag:'wx'});outputHashes[name]=hash(file);
}
writeFileSync(join(target,'manifest.json'),JSON.stringify({source,sourceHash,baseManifest:resolve(manifestPath),baseManifestHash:manifestHash,zones,notes,events:candidate.events,assignments:candidate.assignments,sourceRate,rate,frames,outputHashes,approvedForGame:false,sunoCharacterVerified:false,scope:seconds+'s three-zone sustained source spectrum; explicit octave-offset timbre selection only, unchanged original MIDI events, provisional5ms attack and20ms release; no source separation or audible fidelity approval'},null,2),{flag:'wx'});
console.log(JSON.stringify({target,notes:notes.length,zones:zones.map(zone=>({pitch:zone.pitch,residual:zone.model.model.residualEnergyFraction})),outputHashes,approvedForGame:false}));
