import assert from 'node:assert/strict';
import {ms91GraphicsOptions,type Ms91GraphicsSettings} from '../lib/game/ms91-graphics-options.ts';
const fresh=():Ms91GraphicsSettings=>({graphics:2,slowVideoManagement:false,configuredFramesPerSecond:20});
for(const exit of [-1,255,9]){
  const settings=fresh(),flow=ms91GraphicsOptions(settings);
  assert.deepEqual(flow.next().value,{type:'graphics-menu',resource:'emrl',selected:0,marked:[false,false,true,false,false,true,false,false,true]});
  assert.equal(flow.next(exit).done,true);
  assert.deepEqual(settings,fresh());
}
for(let selection=0;selection<=8;selection++){
  const settings=fresh(),flow=ms91GraphicsOptions(settings);
  flow.next();
  const next=flow.next(selection);
  assert.equal(next.done,false);
  assert.equal(next.value?.type,'graphics-menu');
  if(next.value?.type==='graphics-menu'){
    assert.equal(next.value.selected,selection);
    assert.equal(next.value.marked.filter(Boolean).length,3);
    assert.equal(next.value.marked[selection],true);
  }
  const exited=flow.next(9);
  if(selection===7){
    assert.deepEqual(exited.value,{type:'rate-change-notice',resource:'emrs'});
    assert.equal(settings.configuredFramesPerSecond,10);
    assert.equal(flow.next(0).done,true);
  }else assert.equal(exited.done,true);
}
// A temporary change reverted before exit does not show a misleading notice.
const settings=fresh(),flow=ms91GraphicsOptions(settings);
flow.next();flow.next(7);flow.next(8);
assert.equal(flow.next(9).done,true);
assert.deepEqual(settings,fresh());
console.log('MS91 graphics dispatcher: selections, marks, cancellation and rate notice pass');
