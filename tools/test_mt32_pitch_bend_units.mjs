import assert from 'node:assert/strict';
import {mt32PitchBendUnits} from './mt32_pitch_bend_units.mjs';
for(let range=0;range<=24;range++)for(let value=0;value<16384;value++)assert.equal(mt32PitchBendUnits(value,range),Math.floor((value-8192)*range*683/16384)||0);
assert.equal(mt32PitchBendUnits(8192,2),0);assert.equal(mt32PitchBendUnits(0,2),-683);assert.equal(mt32PitchBendUnits(16383,2),682);
for(const [value,range] of [[0,undefined],[16384,2],[-1,2],[8192,25],[8192,1.5]])assert.throws(()=>mt32PitchBendUnits(value,range));
console.log('409600 explicit bend/range combinations match signed integer equation; no voice or audible pitch claim');
