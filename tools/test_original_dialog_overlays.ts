import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {MS91_DIALOG_TEXT,MS91_EDITOR_DIALOG_TEXT} from '../lib/game/ms91-dialog-resources.ts';
import {optionsVersionResources} from '../lib/game/options-version-resources.ts';
const [legacy,modern]=process.argv.slice(2);assert.ok(legacy&&modern,'Provide untouched distribution ZIPs; no silent skip');
type Bank={bank:string;changed:{id:string;newText?:string}[]};
const banks=JSON.parse(execFileSync('python3',['tools/audit_original_resource_banks.py',legacy,modern,'--text'],{encoding:'utf8'})) as Bank[];
const text=(bank:string,key:string)=>{
 const value=banks.find(row=>row.bank===bank)?.changed.find(entry=>entry.id===key)?.newText;
 assert.notEqual(value,undefined,bank+'/'+key+' must be present in original resource audit');return value!;
};
for(const [key,value] of Object.entries(MS91_DIALOG_TEXT)){
 const bank=['edos','efex','emer','ejox','emrl','emrs'].includes(key)?'MAIN.RES':['emid','emop'].includes(key)?'MISC.PRE':'GAME.PRE';
 assert.equal(value,text(bank,key),bank+'/'+key);
}
for(const [key,value] of Object.entries(MS91_EDITOR_DIALOG_TEXT))assert.equal(value,text('TEDIT.PRE',key),'editor/'+key);
assert.equal(String.fromCharCode(...optionsVersionResources({},'ms-1991').gver).replace(/\0$/,''),text('MISC.PRE','gver'));
console.log('All 11 game-dialog overlays, four bank-scoped editor overlays and version label match original MS91 bytes through NUL');
