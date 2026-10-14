import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {relocateSoundSequences} from '../lib/game/relocate-sound-sequences.ts';
import {loadSoundEffect} from '../lib/game/load-sound-effect.ts';
const [capture,directory,operation]=process.argv.slice(2),initialize=operation==='--initialize';
if(!capture||!directory)throw Error('Usage: comparison-capture resource-directory');
const rows: {engine:string;name:string;device:string;start:number;bytes:number[];header?:number;percussion?:number[][]}[]=JSON.parse(readFileSync(capture,'utf8'));
assert.equal(rows.length,initialize?32:8);
for(const row of rows){
 const path=join(directory,`SKID${row.name}.KMS`),before=new Uint8Array(readFileSync(path)),snapshot=before.slice();
 const loaded=initialize?loadSoundEffect(before,new Uint8Array(readFileSync(join(directory,`${row.device}SKIDMS.VCE`))),Uint8Array.from(row.name,c=>c.charCodeAt(0)),{offset:0,segment:0x8000},{offset:0,segment:0x9000},[]):undefined;
 const result=loaded?.bank??relocateSoundSequences(before,row.start,{offset:0,segment:0x8000});
 if(loaded){assert.equal(loaded.header,row.header);assert.deepEqual(loaded.percussion.map(p=>[p.offset,p.segment]),row.percussion);}
 assert.deepEqual(result,Uint8Array.from(row.bytes),`${row.engine} ${row.name}: complete bank must match original relocation`);
 assert.deepEqual(before,snapshot);assert.deepEqual(new Uint8Array(readFileSync(path)),snapshot);
}
console.log(JSON.stringify({originalNativeWholeBankComparisons:rows.length,bothEditionsAndAllFourScores:true,sourceFilesUnchanged:true,pass:true}));
