import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Read-only, pinned source audit. Not an executed CPU timing oracle.
const commit='2cbc44b2a59a9e871e4bc5aaff1c4eb492576dda';
const paths=['src/machine/machine_table.c','src/cpu/808x.c'];
const hashes=['c0c780db261a91698f94b7f83fa4d184646142097626e5656bfd7b3e90f9680d','fc0306bed0c4622c011c62ad8e87ab1175e2c2dd346ffbba847d836d5d6758f9'];
const sources=[];
for(const path of paths){
 const url=`https://raw.githubusercontent.com/86Box/86Box/${commit}/${path}`;
 const response=await fetch(url);assert.ok(response.ok,`${path}: HTTP ${response.status}`);
 const source=await response.text();
 const sha256=createHash('sha256').update(source).digest('hex');
 assert.equal(sha256,hashes[sources.length],`${path}: reference hash changed`);
 sources.push({path,url,source,sha256});
}
const table=sources[0].source;
const marker=table.indexOf('.internal_name     = "tandy1000sl2"');
assert.ok(marker>=0,'SL/2 machine absent');
const end=table.indexOf('.aliases',marker);assert.ok(end>marker);
const machine=table.slice(marker,end);
assert.match(machine,/\.type\s*=\s*MACHINE_TYPE_8086/);
assert.match(machine,/\.package\s*=\s*CPU_PKG_8086/);
assert.match(machine,/\.init\s*=\s*machine_tandy1000sl2_init/);
const cpu=sources[1].source;
assert.match(cpu,/if \(is8086 && !\(a & 1\)\)/,'Aligned word-access distinction absent');
assert.ok(/wait_cycs\(is_mazovia \? 5 : 4, 1\)/.test(cpu),'Pinned I/O cycle rule absent');
assert.match(cpu,/timer_process\(\)/,'CPU timer delivery absent');
assert.match(cpu,/pfq_add\(c, !bus\)/,'Prefetch/bus interaction absent');
console.log(JSON.stringify({commit,scope:'Pinned source configuration only; no BIOS duration or measured CPU execution',machine:'tandy1000sl2',cpuPackage:'8086',sources:sources.map(({source,...metadata})=>metadata),conclusion:'Do not substitute the TL 80286 profile or derive elapsed BIOS time from instruction counts alone'},null,2));
