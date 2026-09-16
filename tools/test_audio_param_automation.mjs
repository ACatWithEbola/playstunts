import assert from 'node:assert/strict';
import {cancelAndHoldAudioParam} from '../lib/game/audio-param-automation.ts';

const supported={
 value:.4,events:[],
 cancelAndHoldAtTime(at){this.events.push(['hold',at]);},
 cancelScheduledValues(at){this.events.push(['cancel',at]);},
 setValueAtTime(value,at){this.events.push(['set',value,at]);},
};
cancelAndHoldAudioParam(supported,3);
assert.deepEqual(supported.events,[['hold',3]],'supporting browsers must use the native hold operation');

const fallback={
 value:.6,events:[],
 cancelScheduledValues(at){this.events.push(['cancel',at]);},
 setValueAtTime(value,at){this.events.push(['set',value,at]);},
};
cancelAndHoldAudioParam(fallback,7);
assert.deepEqual(fallback.events,[['cancel',7],['set',.6,7]],'other browsers must cancel future automation and hold the current value');

console.log('AudioParam compatibility checks passed.');
