import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalMenuSelectionFlash} from '../lib/game/menu-selection-flash.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,55);
for(const row of rows)assert.deepEqual(originalMenuSelectionFlash(row.counter,row.delta),{counter:row.nextCounter,color:row.colour});
console.log('PASS: 55 native outline timer cases match both original editions, including signed wrapping and inclusive thresholds');
