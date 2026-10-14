import assert from 'node:assert/strict';
import {createBrowserSetupInput,pressBrowserSetupControl} from '../lib/game/browser-setup-input.ts';
import {originalBrowserKey} from '../lib/game/browser-menu-input.ts';
class Canvas extends EventTarget{focused=0;focus(){this.focused++;}}
const canvas=new Canvas() as unknown as HTMLCanvasElement,other=new Canvas() as unknown as HTMLCanvasElement;
assert.equal(pressBrowserSetupControl(canvas,'Enter'),false);
const controller=new AbortController(),input=createBrowserSetupInput(canvas,controller.signal),second=createBrowserSetupInput(other,new AbortController().signal);
for(const key of ['ArrowUp','ArrowDown','Enter','Escape'] as const){assert.equal(pressBrowserSetupControl(canvas,key),true);assert.equal(input.pollKey(),originalBrowserKey(key,false));assert.equal(second.pollKey(),0);}
const pending=input.key();pressBrowserSetupControl(canvas,'ArrowDown');assert.equal(await pending,originalBrowserKey('ArrowDown',false));
pressBrowserSetupControl(canvas,'Enter');pressBrowserSetupControl(canvas,'Escape');assert.equal(await input.key(),originalBrowserKey('Enter',false));assert.equal(await input.key(),originalBrowserKey('Escape',false));
const cancelled=input.key();controller.abort();await assert.rejects(cancelled,/closed/);assert.equal(pressBrowserSetupControl(canvas,'Enter'),false);assert.throws(()=>input.pollKey(),/closed/);
const old=createBrowserSetupInput(canvas,new AbortController().signal),replacement=createBrowserSetupInput(canvas,new AbortController().signal);old.close();assert.equal(pressBrowserSetupControl(canvas,'Enter'),true);assert.equal(replacement.pollKey(),originalBrowserKey('Enter',false));replacement.close();second.close();
console.log('Touch Setup controls share original BIOS key queue, preserve element isolation/FIFO, settle pending reads and reject input after close');
