import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {executeMt32StartupPrograms} from '../lib/game/mt32-startup-programs.ts';
import {executeCooperativeReadyMt32Program} from '../lib/game/cooperative-ready-mt32-program.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
const legacy=readFileSync('public/game/original-resources/MT15.DRV'),patch=readFileSync('public/game/original-resources/MT32.PLB');
let calls=0;
await executeMt32StartupPrograms(legacy.slice(),patch,'ms-1990',program=>{calls++;return executeCooperativeReadyMt32Program(program,{write(){},cancelled:()=>false,yieldTask:async()=>{}});});
assert.equal(calls,3);
const collectStartup=async(mutate:boolean)=>{
 const driverCopy=Buffer.from(legacy),patchCopy=Buffer.from(patch),writes:number[][]=[];
 let stage=0;
 await executeMt32StartupPrograms(driverCopy,patchCopy,'ms-1990',async program=>{
  if(mutate&&stage++===0){driverCopy.fill(0);patchCopy.fill(0);}
  return executeCooperativeReadyMt32Program(program,{write(batch){writes.push(...batch);},cancelled:()=>false,yieldTask:async()=>{}});
 });
 return writes;
};
assert.deepEqual(await collectStartup(true),await collectStartup(false),'Caller buffer reuse during startup cannot alter driver or patch upload bytes');
calls=0;
await assert.rejects(executeMt32StartupPrograms(legacy.slice(),patch,'ms-1990',async()=>{calls++;return 0;}),/initialization result/);
assert.equal(calls,1,'Initialization failure prevents patch upload');
calls=0;
await assert.rejects(executeMt32StartupPrograms(legacy.slice(),patch,'ms-1990',async()=>++calls===1?0xfff6:0xffff),/upload failed/);
calls=0;
await assert.rejects(executeMt32StartupPrograms(legacy.slice(),patch,'ms-1990',async()=>++calls===1?0xfff6:calls===2?0:0xffff),/startup volume failed/);
await assert.rejects(executeMt32StartupPrograms(versionedMt15Resource('ms-1991')!,patch,'ms-1991',program=>executeCooperativeReadyMt32Program(program,{write(){},cancelled:()=>false,yieldTask:async()=>{}})),/timed host/);
for(const generation of ['ms-1990','ms-1991'] as const){
 for(const broken of [new Uint8Array(),Uint8Array.from([1]),Uint8Array.from([1,2,0,0,0,0,0,0,0]),patch.subarray(0,patch.length-1),new Uint8Array(65537)]){
  let executed=0;
  await assert.rejects(executeMt32StartupPrograms(generation==='ms-1991'?versionedMt15Resource(generation)!:legacy.slice(),broken,generation,async()=>{executed++;return 0xfff6;}),/Incomplete Roland/);
  assert.equal(executed,0,'Corrupt patch storage rejects before original device reset or writes');
 }
}
for(const generation of ['ms-1990','ms-1991'] as const){
 for(const size of [0,397,1666,1668,1749,1751,generation==='ms-1991'?1667:1750]){
  let executed=0;
  await assert.rejects(executeMt32StartupPrograms(new Uint8Array(size),patch,generation,async()=>{executed++;return 0xfff6;}),/driver size/);
  assert.equal(executed,0,'Truncated or wrong-generation driver rejects before resetting device');
 }
}
console.log('Shared Roland startup order/results checked; legacy browser executor works and refuses modern PIT waits');
