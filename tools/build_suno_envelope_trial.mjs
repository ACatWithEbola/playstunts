/** Isolated10s bass experiment, never a production music replacement. */
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
const [manifestPath,destination,attackMode='inferred-ramp']=process.argv.slice(2);
if(!['inferred-ramp','nominal5ms'].includes(attackMode))throw Error('Require explicit supported provisional attack mode');
if(!manifestPath||!destination||existsSync(destination))throw Error('Require retained bass manifest and new output directory');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const manifestHash=hash(manifestPath),base=JSON.parse(readFileSync(manifestPath));
if(base.channel!==2||base.layer!=='bass'||base.rate!==48000||base.frames!==9600000||base.approvedForGame!==false||base.model.start!==3||base.model.seconds!==.075)throw Error('Require explicit200s GameOver bass research manifest');
const source=base.model.source,sourceHash=hash(source);
if(sourceHash!==base.inputHashes[0]||sourceHash!==base.model.sourceSha256)throw Error('Source provenance mismatch');
const python='/private/tmp/playstunts-stem-env-20261013/bin/python';
const onset=JSON.parse(execFileSync(python,['tools/inspect_suno_onset.py',source,'8.5','.4'],{encoding:'utf8'}));
assert.equal(onset.estimatedOnsetSeconds,8.642);
const motion=JSON.parse(execFileSync(python,['tools/inspect_suno_spectral_motion.py',source,'8.642','.35','55.1156'],{encoding:'utf8'}));
if(motion.maxWindowResidual>.05)throw Error('Training interval exceeds bounded fit screen');
const magnitudes=motion.windows.map(window=>Math.sqrt(window.amplitudes.flat().reduce((sum,value)=>sum+value*value,0))),peak=Math.max(...magnitudes);
const envelope=[{seconds:0,gain:0},...(attackMode==='nominal5ms'?[{seconds:.005,gain:magnitudes[0]/peak}]:[]),...motion.windows.map((window,i)=>({seconds:window.centerFrame/motion.rate,gain:magnitudes[i]/peak}))];
const sourceRate=32000,rate=48000,seconds=10,sourceEnd=seconds*sourceRate,frames=seconds*rate;
const notes=base.plan.notes.filter(note=>note.startFrame<sourceEnd).map(note=>{
 const copy={...note};if(copy.releaseFrame>sourceEnd){copy.releaseFrame=sourceEnd;copy.windowTruncated=true;delete copy.retriggerAbortFrame;}return copy;
});
const coefficients=base.model.model.stereoCoefficients;
const baseline=renderHarmonicBass(notes,coefficients,sourceRate,rate,frames);
const shaped=renderHarmonicBass(notes,coefficients,sourceRate,rate,frames,[],'reject',envelope);
assert.deepEqual(shaped.events,baseline.events,'Envelope cannot change note trigger/release/pitch');
function wav(pcm){
 const bytes=Buffer.alloc(44+pcm.length*4);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(3,20);bytes.writeUInt16LE(2,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*8,28);bytes.writeUInt16LE(8,32);bytes.writeUInt16LE(32,34);bytes.write('data',36);bytes.writeUInt32LE(pcm.length*4,40);pcm.forEach((value,i)=>bytes.writeFloatLE(value,44+i*4));return bytes;
}
if(hash(source)!==sourceHash||hash(manifestPath)!==manifestHash)throw Error('Research input changed');
mkdirSync(destination);
for(const [name,result] of [['baseline',baseline],['source-envelope',shaped]])writeFileSync(join(destination,name+'.wav'),wav(result.pcm),{flag:'wx'});
const evidence={source,sourceHash,baseManifest:resolve(manifestPath),baseManifestHash:manifestHash,onset,motion,envelope,sourceRate,rate,frames,events:shaped.events,
 attackMode,firstPointPolicy:attackMode==='nominal5ms'?'Retain provisional nominal5ms attack to first measured gain, hold until first measurement; not a verified source attack':'Inferred zero at energy onset; not a verified source attack',endPolicy:'Hold final measured gain until original release; provisional20ms tail',
 approvedForGame:false,sunoCharacterVerified:false,scope:'10s isolated bass envelope comparison; exact inherited note schedule, not full-song fidelity or a production asset'};
writeFileSync(join(destination,'manifest.json'),JSON.stringify(evidence,null,2),{flag:'wx'});
console.log(JSON.stringify({destination,notes:notes.length,profilePoints:envelope.length,sourceUnchanged:hash(source)===sourceHash,approvedForGame:false}));
