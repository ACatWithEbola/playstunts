import assert from 'node:assert/strict';
import {WORLD_DISPLAY_LAYOUTS} from '../lib/game/world-display-layout.ts';
import {resetOriginalWorldRegions} from '../lib/game/reset-world-regions.ts';
for(const [mode,high] of [['mcga',0],['cga',0x5e0],['tandy',0x620],['ega',0x45c]] as const){
 const memory=new Uint8Array(0x100000),d=0x20000,empty=Uint8Array.from([15,39,255,255,15,39,255,255]);memory.set(empty,d+0x3312);resetOriginalWorldRegions(memory,d,mode);
 const a=WORLD_DISPLAY_LAYOUTS[mode].address;
 for(let index=0;index<15;index++){
  assert.equal(a(0x901a+index*8),0x901a+index*8+high);assert.deepEqual(memory.slice(d+a(0x901a+index*8),d+a(0x901a+index*8)+8),empty);
 }
 for(let byte=0;byte<120;byte++)assert.equal(a(0x901a+byte),0x901a+byte+high);
}
console.log('All fifteen world-region records map to the exact bank reset by each native display mode');
