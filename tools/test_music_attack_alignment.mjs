import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {analyze} from './analyze_music_alignment.mjs';
const directory=mkdtempSync(join(tmpdir(),'stunts-stereo-attack-'));
const render=(name,expression)=>{
 const path=join(directory,name+'.wav');
 execFileSync('ffmpeg',['-v','error','-n','-f','lavfi','-i',
  `aevalsrc='${expression}':s=16000:d=3`,'-c:a','pcm_f32le',path]);
 return analyze(path);
};
const tone='if(between(t,0.2,0.4),0.4*sin(2*PI*440*t),0)';
const same=render('same',`${tone}|${tone}`);
const opposite=render('opposite',`${tone}|-(${tone})`);
assert.ok(same.peakRms>0.2);
assert.equal(opposite.peakRms,same.peakRms);
assert.deepEqual(opposite.attacks,same.attacks,
 'Opposite-phase stereo has the same attacks, not false silence');
const silent=render('silence','0|0');
assert.equal(silent.peakRms,0);assert.deepEqual(silent.attacks,[]);
assert.throws(()=>analyze('unused',NaN),/Invalid/);
assert.throws(()=>analyze('unused',-1),/Invalid/);
console.log('Coarse attack analysis preserves opposite-phase stereo energy and reports silence without false attacks');
