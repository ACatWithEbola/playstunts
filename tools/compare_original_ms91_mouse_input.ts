import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalMouseSteering} from '../lib/game/race-input-selection.ts';
const capture=readFileSync(process.argv[2]);assert.equal(capture.length,65536);
for(let x=0;x<65536;x++)assert.equal(originalMouseSteering(x,'ms-1991')&255,capture[x],'Mouse X word '+x);
for(let x=0;x<65536;x++)assert.equal(originalMouseSteering(x),originalMouseSteering(x,'ms-1990'));
console.log(JSON.stringify({originalMouseWords:65536,legacyDefaultPreserved:true,pass:true}));
