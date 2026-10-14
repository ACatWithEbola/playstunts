import assert from 'node:assert/strict';
import {ms91GraphicsAction} from '../lib/game/ms91-graphics-action.ts';
const settings={graphics:2,slowVideoManagement:false,configuredFramesPerSecond:20 as 10|20};
const active={physicsEngine:'ms-1991',framesPerSecond:20},before=structuredClone(active);
const action=ms91GraphicsAction(settings);
assert.deepEqual(action.next().value,{type:'save'});
assert.deepEqual(action.next(0).value,{type:'pause-audio'});
assert.equal(action.next(0).value?.type,'graphics-menu');
assert.equal(action.next(6).value?.type,'graphics-menu');assert.equal(settings.graphics,2);assert.equal(settings.slowVideoManagement,true);
assert.equal(action.next(7).value?.type,'graphics-menu');assert.equal(settings.graphics,2);assert.equal(settings.configuredFramesPerSecond,10);
assert.deepEqual(action.next(9).value,{type:'rate-change-notice',resource:'emrs'});
assert.deepEqual(action.next(0).value,{type:'resume-audio'});
assert.deepEqual(action.next(0).value,{type:'restore'});assert.ok(action.next(0).done);
assert.deepEqual(active,before);
for(const cancel of [-1,255]){
 const s={graphics:4,slowVideoManagement:false,configuredFramesPerSecond:20 as 10|20},original=structuredClone(s),flow=ms91GraphicsAction(s);
 flow.next();flow.next(0);flow.next(0);
 assert.deepEqual(flow.next(cancel).value,{type:'resume-audio'});
 assert.deepEqual(flow.next(0).value,{type:'restore'});assert.ok(flow.next(0).done);assert.deepEqual(s,original);
}
console.log('MS91 graphics lifecycle preserves save/pause/menu/notice/resume/restore ordering and cancellation');
