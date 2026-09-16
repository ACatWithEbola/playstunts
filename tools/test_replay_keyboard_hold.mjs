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
globalThis.window=new EventTarget();
globalThis.requestAnimationFrame=()=>1;
globalThis.cancelAnimationFrame=()=>{};
const canvas=new FakeCanvas(),input=createBrowserMenuInput(canvas);
const key=(type,code,value)=>{const event=new Event(type);Object.defineProperties(event,{code:{value:code},key:{value},ctrlKey:{value:false},shiftKey:{value:false}});canvas.dispatchEvent(event);};
key('keydown','Space',' ');assert.equal(input.replayActivationButtons(),32,'the browser Space keydown must remain held');
key('keyup','Space',' ');assert.equal(input.replayActivationButtons(),0,'the browser Space keyup must release replay scrub');
key('keydown','Enter','Enter');assert.equal(input.replayActivationButtons(),16,'the browser Enter keydown must remain held');
key('keyup','Enter','Enter');assert.equal(input.replayActivationButtons(),0,'the browser Enter keyup must release replay scrub');
input.close();

console.log('Replay keyboard hold checks passed.');
