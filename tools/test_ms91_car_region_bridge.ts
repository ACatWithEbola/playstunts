import assert from 'node:assert/strict';
import {originalPlayerCarSubmission,originalOpponentCarSubmission} from '../lib/game/player-car-submission.ts';
import {WORLD_DISPLAY_LAYOUTS} from '../lib/game/world-display-layout.ts';
for(const mode of ['mcga','cga','tandy','ega'] as const)for(const [index,submit] of [originalPlayerCarSubmission,originalOpponentCarSubmission].entries()){
 const memory=new Uint8Array(0x100000),d=0x20000,layout=WORLD_DISPLAY_LAYOUTS[mode],before=memory.slice();
 const wheels=()=>{throw Error('Low detail must not update wheels');};
 const legacy=submit(memory,d,[0,0,0],1,0,0,wheels,layout),modern=submit(memory,d,[0,0,0],1,0,0,wheels,{...layout,ms91SlowVideoManagement:true});
 assert.equal(legacy.record[18],4);assert.equal(modern.record[18],12);
 const expected=[...legacy.record];expected[18]=12;assert.deepEqual(modern.record,expected);
 assert.equal(modern.record[8]|modern.record[9]<<8,layout.address(index?0x903a:0x9032));assert.deepEqual(memory,before);
}
console.log('MS91 player/opponent region bridge retains mapped bank indices and changes only verified active descriptor flags; legacy/source memory unchanged');
for(const mode of ['mcga','cga','tandy','ega'] as const)for(const [index,submit] of [originalPlayerCarSubmission,originalOpponentCarSubmission].entries())for(const status of [0,1,2]){
 const memory=new Uint8Array(0x100000),d=0x20000,base=WORLD_DISPLAY_LAYOUTS[mode],scratch=index?0xee70:0xee94;
 memory.set([64,1,0,0,200,0,0,0],d+0x3312);memory[d+base.address(index?0x8da1:0x8ce9)]=status;
 const before=memory.slice(),layout={...base,ms91SlowVideoManagement:false,ms91CarRegionScratch:{player:0xee94,opponent:0xee70}};
 const result=submit(memory,d,[0,0,0],1,0,0,()=>{throw Error('Unexpected wheel update');},layout);
 assert.equal(result.record[18],status===1?12:4);
 assert.equal(result.record[8]|result.record[9]<<8,status===1?scratch:base.address(index?0x903a:0x9032));
 if(status===1){assert.deepEqual(memory.slice(d+scratch,d+scratch+8),before.slice(d+0x3312,d+0x331a));before.set(memory.slice(d+scratch,d+scratch+8),d+scratch);}
 assert.deepEqual(memory,before,'Only explicitly owned local scratch may change');
}
console.log('MS91 fast-video player/opponent status1 branches use local empty bounds across all four display layouts; other statuses preserve retained pointers');
