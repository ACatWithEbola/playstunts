import assert from 'node:assert/strict';
import {test} from 'node:test';
import {upgradedCarCastsShadow,upgradedHasActiveCrashFragments} from '../lib/game/upgraded-crash-presentation.ts';

const d=0x2d1a0;
function memory(){return new Uint8Array(d+0x9000);}
function particle(target:Uint8Array,index:number,speed:number,style:number,owner:number){
 const view=new DataView(target.buffer);view.setUint16(d+0x8e44+index*2,speed,true);
 target[d+0x8ee1+index]=style;target[d+0x8ef9+index]=owner;
}

await test('ordered crash fallback follows only active renderable fragments',()=>{
 const live=memory();
 assert.equal(upgradedHasActiveCrashFragments(live,d),false);
 particle(live,0,20,4,0);assert.equal(upgradedHasActiveCrashFragments(live,d),true);
 particle(live,0,0,4,0);assert.equal(upgradedHasActiveCrashFragments(live,d),false,'finished debris must restore upgraded shadows');
 particle(live,0,20,4,7);assert.equal(upgradedHasActiveCrashFragments(live,d),false,'stale unknown-owner slots are not crash fragments');
 particle(live,0,20,3,0);assert.equal(upgradedHasActiveCrashFragments(live,d),false,'stale non-fragment styles are ignored');
 particle(live,1,20,8,1);assert.equal(upgradedHasActiveCrashFragments(live,d),true,'opponent fragments retain the ordered crash animation');
});

await test('visible crashed cars retain upgraded shadows',()=>{
 assert.equal(upgradedCarCastsShadow(false,false,0),true);
 assert.equal(upgradedCarCastsShadow(false,false,1),true,'crash state 1 remains visible in the original world');
 assert.equal(upgradedCarCastsShadow(false,false,2),false,'water-hidden cars do not cast a shadow');
 assert.equal(upgradedCarCastsShadow(true,false,0),false,'an absent opponent cannot cast a shadow');
 assert.equal(upgradedCarCastsShadow(true,true,1),true);
});
