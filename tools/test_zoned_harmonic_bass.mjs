import assert from 'node:assert/strict';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
import {renderZonedHarmonicBass} from './render_zoned_harmonic_bass.mjs';
const zones=[{pitch:40,coefficients:[[0,0],[.05,-.05],[.02,-.02]]},{pitch:44,coefficients:[[0,0],[.03,-.03],[.01,-.01]]}];
const notes=[40,44,42,38,46].map((pitch,i)=>({pitch,velocity:80+i,startFrame:i*100,releaseFrame:i*100+300}));
const before=structuredClone({zones,notes});
const actual=renderZonedHarmonicBass(notes,zones,32000,48000,3000);
assert.deepEqual(actual.assignments.map(item=>item.sourceZonePitch),[40,44,40,40,44]);
assert.deepEqual(actual.events,renderHarmonicBass(notes,zones[0].coefficients,32000,48000,3000).events,'Zone selection cannot change pitch, velocity, triggers, releases or tails');
const expected=new Float32Array(6000);
for(const pitch of [40,44]){
 const group=notes.filter((_,i)=>actual.assignments[i].sourceZonePitch===pitch);
 const result=renderHarmonicBass(group,zones.find(zone=>zone.pitch===pitch).coefficients,32000,48000,3000);
 for(let i=0;i<expected.length;i++)expected[i]+=result.pcm[i];
}
assert.deepEqual(actual.pcm,expected);
assert.deepEqual({zones,notes},before);
assert.deepEqual(renderZonedHarmonicBass(notes,[zones[0]],32000,48000,3000).pcm,renderHarmonicBass(notes,zones[0].coefficients,32000,48000,3000).pcm);
for(const invalid of [[],[zones[1],zones[0]],[zones[0],zones[0]],[{...zones[0],pitch:NaN}],[zones[0],{pitch:45,coefficients:[[0,0],[NaN,0],[0,0]]}]])assert.throws(()=>renderZonedHarmonicBass(notes,invalid,32000,48000,3000));
assert.equal(actual.approvedForGame,false);
assert.throws(()=>renderZonedHarmonicBass([],zones,32000,48000,-1),/layout/);
assert.ok(renderZonedHarmonicBass([],zones,32000,48000,100).pcm.every(value=>value===0));
console.log('Offline timbre zones select nearest source pitch (lower wins ties), preserve original events and sum independently; malformed/unused templates rejected');
