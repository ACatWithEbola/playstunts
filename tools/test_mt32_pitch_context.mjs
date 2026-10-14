import assert from 'node:assert/strict';
import {auditPitchContext} from './audit_mt32_pitch_context.mjs';
import {mkdtempSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const patchTemp=Array.from({length:9},()=>[0,0,24,50,2,0,1,0,100,7,0,0,0,0,0,0]).flat();
const trace={generation:'ms-1991',sampleRate:32000,frames:100,events:[[10,0x330,0xe5],[10,0x330,0],[10,0x330,0]]};
const patches={generation:'ms-1991',sampleRate:32000,frames:100,states:[{fromFrame:0,toFrame:0,channels:[1,2,3,4,5,6,7,8,9],patchTemp}]};
const report=auditPitchContext(trace,patches,'over');
assert.equal(report.neutralCoarseAndFinePatchPitch,true);assert.equal(report.originalExpressionApplied,false);
assert.equal(report.channels.find(channel=>channel.channel===5).minUnits,-683);
assert.equal(report.channels.find(channel=>channel.channel===5).wheelEvents,1);
for(const [offset,value,pattern] of [[2,25,/coarse/],[3,51,/fine/],[4,25,/sensitivity/],[5,1,/assign/]]){
 const changed=structuredClone(patches);changed.states[0].patchTemp[4*16+offset]=value;assert.throws(()=>auditPitchContext(trace,changed,'over'),pattern);
}
const ambiguous=structuredClone(patches);ambiguous.states[0].channels[3]=5;
assert.throws(()=>auditPitchContext(trace,ambiguous,'over'),/ambiguous/);
assert.throws(()=>auditPitchContext(trace,{...patches,states:[]},'over'),/No patch/);
assert.throws(()=>auditPitchContext({...trace,frames:101},patches,'over'));
const root=mkdtempSync(join(tmpdir(),'stunts-pitch-context-')),tracePath=join(root,'shifted.json'),output=join(root,'candidate');
const shifted=patchTemp.slice();shifted[4*16+2]=25;
writeFileSync(tracePath,JSON.stringify({generation:'ms-1991',sampleRate:32000,frames:384000,finalChannelAssignments:[1,2,3,4,5,6,7,8,9],finalPatchTemp:shifted}));
const built=spawnSync(process.execPath,['tools/build_suno_lead_audition.mjs',resolve('tools/test_mt32_pitch_context.mjs'),tracePath,process.execPath,output,'5','--gameover-lead-cycles'],{encoding:'utf8'});
assert.notEqual(built.status,0);assert.match(built.stderr,/Coarse patch key shift requires explicit note transposition/);assert.equal(existsSync(output),false,'Unsupported transposition cannot write a candidate');
console.log('Patch pitch audit rejects unmodeled transposition, fine tune, assignment and invalid context; wheel expression remains unapplied');
