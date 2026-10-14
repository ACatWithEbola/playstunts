import assert from 'node:assert/strict';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {originalDialogSession} from '../lib/game/dialog-session.ts';
import {ms91GraphicsAction} from '../lib/game/ms91-graphics-action.ts';
const bytes=Array.from(new TextEncoder().encode('Simulation speed will change]at the start of the next race.\0'));
const content=originalDialogContent(bytes,line=>line.length*8,-1,-1,4,'ms-1991');
const notice=originalDialogSession(content,4);
assert.deepEqual(notice.next(),{done:false,value:{type:'draw',selected:-1}});
assert.deepEqual(notice.next(),{done:false,value:{type:'delay',ticks:8}});
assert.deepEqual(notice.next(),{done:true,value:1});
const settings={graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20 as 10|20},action=ms91GraphicsAction(settings);
let step=action.next(),notices=0,selectedSlow=false;
while(!step.done){
 let reply=0;
 if(step.value.type==='graphics-menu'){reply=selectedSlow?-1:7;selectedSlow=true;}
 if(step.value.type==='rate-change-notice')notices++;
 step=action.next(reply);
}
assert.equal(settings.configuredFramesPerSecond,10);assert.equal(notices,1);
console.log('MS91 speed-change notice is a timed8-tick notification, not an acknowledgement dialog; rate change emits it exactly once');
