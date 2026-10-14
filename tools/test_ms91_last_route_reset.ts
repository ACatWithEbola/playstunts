import assert from 'node:assert/strict';
import {initializePlayerRace} from '../lib/physics/initialize-player-race.ts';
for(const value of [1,321,32768,65535]){
 const before=new Uint8Array(0x30f),v=new DataView(before.buffer),at=0x8daa-0x8c06;v.setUint16(at,value,true);
 const preserved=before.slice(),tuning=new Uint8Array(776);
 const modern=initializePlayerRace(before,tuning,0,10,17,0,0,'ms-1991');
 assert.equal(new DataView(modern.buffer).getUint16(at,true),0);
 const legacy=initializePlayerRace(before,tuning,0,10,17,0,0,'ms-1990');
 assert.equal(new DataView(legacy.buffer).getUint16(at,true),value);
 assert.deepEqual(legacy,initializePlayerRace(before,tuning,0,10,17,0,0));assert.deepEqual(before,preserved);
}
console.log(JSON.stringify({retainedRouteValues:4,modernResetVerified:true,legacyPreserved:true,pass:true}));
