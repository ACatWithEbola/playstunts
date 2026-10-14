import assert from 'node:assert/strict';
import {createOriginalTandyToneAudio} from '../lib/game/tandy-tone-audio.ts';

const output=createOriginalTandyToneAudio(44100,{variant:'pssj3',clockHz:3579545,psgGain:.5,speakerGain:1});
output.write(0xc4,0);
assert.equal(output.render(512).length,512);
assert.throws(()=>output.write(0xc4,3),/sample hardware scheduler/);
assert.throws(()=>output.write(0xc5,128),/Unreconstructed Tandy sound output port/);
assert.throws(()=>output.write(0xc6,64),/sample hardware scheduler/);
console.log('Modern tone-only boot accepts DAC disable, while sampled DAC output still requires its host');
