import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {MS91_DIALOG_TEXT,MS91_EDITOR_DIALOG_TEXT} from '../lib/game/ms91-dialog-resources.ts';
const [oldZip,newZip]=process.argv.slice(2);assert.ok(oldZip&&newZip,'Provide both original archives');
const result=spawnSync('python3',['tools/audit_original_resource_banks.py',oldZip,newZip,'--text'],{encoding:'utf8'});
assert.equal(result.status,0,result.stderr);
const banks=JSON.parse(result.stdout) as {bank:string;changed:{id:string;newText?:string}[]}[];
let checked=0;
for(const bank of banks){
 const overlay:Record<string,string>=bank.bank==='TEDIT.PRE'?MS91_EDITOR_DIALOG_TEXT:MS91_DIALOG_TEXT;
 for(const item of bank.changed){
  if(item.id==='gver'||item.newText===undefined)continue;
  assert.equal(overlay[item.id],item.newText,bank.bank+':'+item.id);checked++;
 }
}
assert.equal(checked,15);
console.log(checked+' changed/new original dialog strings match exact bank-scoped overlays');
