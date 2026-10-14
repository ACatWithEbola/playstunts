import assert from 'node:assert/strict';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
import {updateMs91TandyVoice} from '../lib/game/ms91-tandy-voice-update.ts';
import {updateOriginalTandyVoice} from '../lib/game/tandy-voice-update.ts';
for(let channel=0;channel<6;channel++)for(const cx of [0,4,65535]){
 const driver=versionedTd15Resource('ms-1991')!,voice=new Uint8Array(46),timer=new Uint8Array(72),instrument=new Uint8Array(96);
 voice[1]=1;voice[3]=20;voice[4]=123;voice[5]=1;voice[6]=255;voice[7]=255;
 const directDriver=driver.slice(),directVoice=voice.slice();
 const expected=updateMs91TandyVoice(directDriver,channel,directVoice,timer,instrument,cx,0xa7);
 const actual=updateOriginalTandyVoice(driver,0x2000,channel,voice,timer,instrument,cx,0xa7,'ms-1991');
 assert.deepEqual(actual,{...expected,bios:[]});assert.deepEqual(driver,directDriver);assert.deepEqual(voice,directVoice);
 assert.equal(voice[6]|voice[7]<<8,379,'modern voice retains current pitch for every active channel');
 if(channel===5)assert.deepEqual(actual.writes,[[0x61,0xa4]],'modern PC channel honors zero volume gate');
 if(channel===0){assert.equal(actual.bios.length,0);assert.ok(actual.writes.some(([p])=>p===0xc6));}
}
const state=versionedTd15Resource('ms-1991')!,snapshot=state.slice(),inactive=new Uint8Array(46);
assert.deepEqual(updateMs91TandyVoice(state,3,inactive,new Uint8Array(72),new Uint8Array(96),123,0),{writes:[],cx:123});assert.deepEqual(state,snapshot);
console.log('Modern Tandy voice dispatch: explicit generation selects new logic,no BIOS sample requests,current pitch retention and PC-volume gate; inactive state unchanged');
