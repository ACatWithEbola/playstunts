import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalDialogInput} from '../lib/game/dialog-input.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.ok(rows.length===1020||rows.length===16520,'Expected complete standard or expanded original corpus');
for(const row of rows)assert.deepEqual(originalDialogInput(row.input),row.expected,JSON.stringify(row.input));
console.log(JSON.stringify({originalComparedInputCases:rows.length,hoverShortcutsAcceptanceCancellationAndNavigationMatch:true,pass:true}));
