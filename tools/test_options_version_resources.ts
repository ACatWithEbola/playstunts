import assert from 'node:assert/strict';
import {optionsVersionResources} from '../lib/game/options-version-resources.ts';
const resources={gver:[1,2,0],emrl:[3,4,0]},before=structuredClone(resources);
assert.equal(optionsVersionResources(resources),resources);
assert.equal(optionsVersionResources(resources,'ms-1990'),resources);
const modern=optionsVersionResources(resources,'ms-1991');
assert.equal(String.fromCharCode(...modern.gver),'Version 1.1 (Feb 25 1991)\0');
assert.equal(modern.emrl,resources.emrl);assert.deepEqual(resources,before);
console.log('MS91 options label is explicit and copy-only; legacy label and graphics choices unchanged');
