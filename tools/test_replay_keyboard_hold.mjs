import assert from 'node:assert/strict';
import {createBrowserMenuInput} from '../lib/game/browser-menu-input.ts';
import {replayKeyboardHoldButtons} from '../lib/game/replay-keyboard-hold.ts';

assert.equal(replayKeyboardHoldButtons(false,false),0,'released keyboard activators must not hold replay scrub');
assert.equal(replayKeyboardHoldButtons(true,false),32,'held Space must follow the original left-button hold path');
assert.equal(replayKeyboardHoldButtons(false,true),16,'held Enter must follow the original right-button hold path');
assert.equal(replayKeyboardHoldButtons(true,true),48,'simultaneous activators must retain both original button bits');

class FakeCanvas extends EventTarget {
 style={};ownerDocument=new EventTarget();
 getBoundingClientRect(){return {left:0,top:0,width:320,height:200};}
 setPointerCapture(){}hasPointerCapture(){return false;}releasePointerCapture(){}focus(){}
}
class FakeWindow extends EventTarget {
 addEventListener(type,listener,options){super.addEventListener(type,listener,options);this.listeners=(this.listeners??0)+1;}
 removeEventListener(type,listener,options){super.removeEventListener(type,listener,options);this.listeners--;}
}
globalThis.window=new FakeWindow();
globalThis.requestAnimationFrame=()=>1;
globalThis.cancelAnimationFrame=()=>{};
const canvas=new FakeCanvas(),input=createBrowserMenuInput(canvas);
const key=(type,code,value)=>{const event=new Event(type);Object.defineProperties(event,{code:{value:code},key:{value},ctrlKey:{value:false},shiftKey:{value:false}});canvas.dispatchEvent(event);};
key('keydown','Space',' ');assert.equal(input.replayActivationButtons(),32,'the browser Space keydown must remain held');
key('keyup','Space',' ');assert.equal(input.replayActivationButtons(),0,'the browser Space keyup must release replay scrub');
key('keydown','Enter','Enter');assert.equal(input.replayActivationButtons(),16,'the browser Enter keydown must remain held');
key('keyup','Enter','Enter');assert.equal(input.replayActivationButtons(),0,'the browser Enter keyup must release replay scrub');
key('keydown','ArrowLeft','ArrowLeft');
const windowKey=(type,code,value)=>{const event=new Event(type);Object.defineProperties(event,{code:{value:code},key:{value},ctrlKey:{value:false},shiftKey:{value:false}});window.dispatchEvent(event);};
windowKey('keyup','ArrowLeft','ArrowLeft');
key('keydown','ArrowRight','ArrowRight');
assert.equal(input.controls()&12,4,'a release retargeted to the window must not leave opposing steering held');
canvas.ownerDocument.dispatchEvent(new Event('fullscreenchange'));
assert.equal(input.controls()&12,0,'a fullscreen transition must clear held steering state');
const listenersBeforeClose=window.listeners;
input.close();
assert.equal(window.listeners,0,'closing browser input must remove its window listeners');
assert.ok(listenersBeforeClose>0,'browser input must install window lifecycle listeners');

console.log('Replay keyboard hold checks passed.');

let ownedTicks=1000,ownedGameTicks=77;
const owned=createBrowserMenuInput(new FakeCanvas(),{clock:{counter:()=>ownedTicks,gameCounter:()=>ownedGameTicks}});
assert.equal(owned.readImmediate().delta,0,'External input clock starts from its supplied epoch, not browser construction time');
ownedTicks+=13;ownedGameTicks+=2;
assert.equal(owned.readImmediate().delta,13);
assert.deepEqual(owned.counters(),{input:1013,game:79},'Game counter must come from owner, not an assumed divide-by-five');
globalThis.requestAnimationFrame=callback=>{queueMicrotask(callback);return 1;};
assert.equal(await owned.gameCounter(),79);
assert.deepEqual(await owned.keyboard(),{key:0,input:1013,game:79});
owned.close();assert.equal(window.listeners,0);
console.log('Explicit browser menu clock supplies input deltas and game counter; omitted clock retains existing browser behavior');
