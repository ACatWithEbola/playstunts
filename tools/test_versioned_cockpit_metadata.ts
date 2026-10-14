import assert from 'node:assert/strict';
import {applyVersionedCockpitMetadata} from '../lib/game/versioned-cockpit-metadata.ts';
import {COCKPIT_DISPLAY_LAYOUTS} from '../lib/game/cockpit-display-layout.ts';
for(const mode of ['mcga','cga','tandy','ega'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,at=COCKPIT_DISPLAY_LAYOUTS[mode],v=new DataView(memory.buffer),bank=0x80000;
 memory.set(new TextEncoder().encode('JAGU'),d+at(0x8fc2));v.setUint16(d+at(0x5482),0,true);v.setUint16(d+at(0x5482)+2,0x8000,true);
 memory.fill(71,bank,bank+1648);v.setUint16(bank+8,136,true);v.setUint16(bank+10,148,true);const before=memory.slice();
 for(const engine of [undefined,'ms-1990','bb-1991'] as const){applyVersionedCockpitMetadata(memory,d,mode,engine);assert.deepEqual(memory,before);}
 applyVersionedCockpitMetadata(memory,d,mode,'ms-1991');assert.equal(v.getUint16(bank+8,true),0);assert.equal(v.getUint16(bank+10,true),0);
 assert.deepEqual(memory.subarray(bank+16,bank+1648),before.subarray(bank+16,bank+1648));
 const differences=Array.from(memory.keys()).filter(i=>memory[i]!==before[i]);assert.deepEqual(differences,[bank+8,bank+10]);
 applyVersionedCockpitMetadata(memory,d,mode,'ms-1991');
 applyVersionedCockpitMetadata(memory,d,mode,'ms-1990');assert.deepEqual(memory,before,'Retained dashboard must restore legacy metadata');
 memory[d+0x90f8+{mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode]]=1;const disabled=memory.slice();applyVersionedCockpitMetadata(memory,d,mode,'ms-1991');assert.deepEqual(memory,disabled,'Disabled dashboard cannot touch an absent/stale bank');
}
console.log('Four display layouts apply only two verified MS1991 Jaguar header bytes; legacy/BB/pixels untouched, idempotent');
