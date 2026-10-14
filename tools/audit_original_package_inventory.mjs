/** Compare untouched distribution ZIPs, not test-mutated extracted folders. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [oldZip,newZip]=process.argv.slice(2);assert.ok(oldZip&&newZip);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=[oldZip,newZip].map(path=>hash(readFileSync(path)));
function inventory(path){
 const names=execFileSync('unzip',['-Z1',path],{encoding:'utf8'}).trim().split('\n').filter(n=>!n.endsWith('/'));
 const out=new Map();
 for(const name of names){const key=name.split('/').at(-1).toUpperCase();assert.ok(!out.has(key),'Duplicate archive filename');out.set(key,hash(execFileSync('unzip',['-p',path,name],{maxBuffer:10000000})));}
 return out;
}
const old=inventory(oldZip),modern=inventory(newZip),same=[],changed=[],oldOnly=[],newOnly=[];
for(const [name,digest] of old)if(!modern.has(name))oldOnly.push(name);else(digest===modern.get(name)?same:changed).push(name);
for(const name of modern.keys())if(!old.has(name))newOnly.push(name);
assert.deepEqual([oldZip,newZip].map(path=>hash(readFileSync(path))),before);
console.log(JSON.stringify({packageHashes:before,oldCount:old.size,newCount:modern.size,same:same.sort(),changed:changed.sort(),oldOnly:oldOnly.sort(),newOnly:newOnly.sort(),sourceUnchanged:true},null,2));
