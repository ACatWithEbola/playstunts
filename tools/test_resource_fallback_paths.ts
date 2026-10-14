import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadNativeGameResource} from '../lib/game/load-game-resource.ts';
const editions=[['/private/tmp/stunts-replay-compat.yCuHpw/ms90-unpacked-audit/EGA-unpacked.bin',0x32090,0x3398,0x339d],['/private/tmp/stunts-replay-compat.yCuHpw/ms91-unpacked/EGA-unpacked.bin',0x32a90,0x346c,0x3471]] as const;
let cases=0;let previous:string[]|undefined;
for(const [path,base,res,pre] of editions){
 const image=readFileSync(path),text=(at:number)=>Buffer.from(image.subarray(base+at,image.indexOf(0,base+at))).toString('latin1');
 const extensions=[text(res),text(pre)];if(previous)assert.deepEqual(extensions,previous);previous=extensions;
 for(const name of ['MISC','OPP1','LONGNAME'])for(const failures of [0,1,2]){
  const memory=new Uint8Array(65536);memory.set(Buffer.from(name+'\0'),0x2000);
  memory.set(Buffer.from(extensions[0]+'\0'),0x3398);memory.set(Buffer.from(extensions[1]+'\0'),0x339d);
  const originalName=memory.slice(0x2000,0x2000+name.length+1),events:unknown[]=[],pointer={offset:0x1000,segment:0x9000};let calls=0;
  const result=await loadNativeGameResource({memory:()=>memory,async load(kind,at){const expectedKind=calls%2?7:1;assert.equal(kind,expectedKind);let end=at;while(memory[end])end++;assert.equal(Buffer.from(memory.slice(at,end)).toString(),name+extensions[calls%2]);events.push(['load',kind]);return calls++>=failures?pointer:null;},async retry(){events.push(['retry']);return 2;}},0,0x2000,0xf000);
  assert.deepEqual(result,pointer);assert.equal(calls,failures+1);
  assert.deepEqual(events,failures===0?[['load',1]]:failures===1?[['load',1],['load',7]]:[['load',1],['load',7],['retry'],['load',1]]);
  assert.deepEqual(memory.slice(0x2000,0x2000+name.length+1),originalName);cases++;
 }
}
console.log(`PASS: ${cases} RES/PRE fallback cases with original edition extensions, filenames, retry semantics and unchanged source names`);
