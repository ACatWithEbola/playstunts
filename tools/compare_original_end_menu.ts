import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {advanceOriginalEndMenu} from '../lib/game/end-menu-input.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
const run=spawnSync('python3',['tools/check_original_end_menu.py',legacy,modern,'--libraries',libraries],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
const capture=JSON.parse(run.stdout);assert.equal(capture.cases.length,168);assert.equal(capture.sourcesUnchanged,true);
for(const row of capture.cases){
 const result=advanceOriginalEndMenu({selected:row.selected,evaluationAvailable:row.evaluationAvailable,evaluationStatus:row.evaluationStatus,showEvaluation:1,physicsEngine:row.engine},row.key);
 assert.equal(result.state.selected,row.result,JSON.stringify(row));
}
console.log(JSON.stringify({originalMenuCases:168,bothEngines:true,signedByteEdges:true,pass:true}));
