import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {initializeCar} from '../lib/physics/initialize-car.ts';
const [image,cars,libraries]=process.argv.slice(2);
assert.ok(image&&cars&&libraries);
const run=spawnSync('python3',[new URL('./check_original_ms91_car_init.py',import.meta.url).pathname,image,cars,'--libraries',libraries],{encoding:'utf8',maxBuffer:2*1024*1024});
assert.equal(run.status,0,run.stderr);
const rows=JSON.parse(run.stdout);assert.equal(rows.length,44);
const decode=(hex:string)=>Uint8Array.from(Buffer.from(hex,'hex'));
const common=(bytes:Uint8Array)=>{const out=new Uint8Array(184);out.set(bytes.slice(0,140));out.set(bytes.slice(164,208),140);return out;};
const mismatches=[];
for(const row of rows){
 const actual=initializeCar(common(decode(row.before)),decode(row.tuning),row.transmission,row.position,row.heading,'ms-1991'),expected=common(decode(row.after));
 const legacy=initializeCar(common(decode(row.before)),decode(row.tuning),row.transmission,row.position,row.heading);
 assert.deepEqual(legacy.slice(0x74,0x8c),common(decode(row.before)).slice(0x74,0x8c),'Legacy retained cache must remain unchanged');
 const offsets=Array.from(actual).flatMap((value,index)=>value===expected[index]?[]:[index]);
 if(offsets.length)mismatches.push({car:row.car,heading:row.heading,offsets});
}
if(mismatches.length)console.log(JSON.stringify({mismatchingCases:mismatches.length,offsets:[...new Set(mismatches.flatMap(row=>row.offsets))].sort((a,b)=>a-b).map(n=>'0x'+n.toString(16))}));
assert.equal(mismatches.length,0,'Original MS91 initializer comparison failed');
console.log(JSON.stringify({originalMS91:true,cars:11,cases:44,commonStateBytes:184,pass:true}));
