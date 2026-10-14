import assert from 'node:assert/strict';
import {createBrowserMenuInput} from '../lib/game/browser-menu-input.ts';

class Canvas extends EventTarget {
 style={}; ownerDocument=new EventTarget(); captured:number|undefined;
 getBoundingClientRect(){return {left:20,top:30,width:640,height:400};}
 setPointerCapture(id:number){this.captured=id;}
 hasPointerCapture(id:number){return this.captured===id;}
 releasePointerCapture(){this.captured=undefined;}
 focus(){}
}
Object.assign(globalThis,{window:new EventTarget(),requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
const canvas=new Canvas(),input=createBrowserMenuInput(canvas as unknown as HTMLCanvasElement);
function touch(type:string,x:number,y:number,buttons:number){
 const event=new Event(type,{cancelable:true});
 Object.defineProperties(event,{clientX:{value:x},clientY:{value:y},buttons:{value:buttons},pointerId:{value:7},pointerType:{value:'touch'}});
 canvas.dispatchEvent(event);return event;
}
assert.equal(touch('pointerdown',340,230,1).defaultPrevented,true);
assert.equal(canvas.captured,7);
assert.deepEqual(input.mouse(),{x:160,y:100,buttons:1});
assert.equal(input.controls(),0,'A menu touch is not a synthetic driving key');
touch('pointerup',340,230,0);
assert.equal(input.mouse().buttons,0);
touch('pointerdown',340,230,1);
touch('pointercancel',340,230,0);
assert.equal(input.mouse().buttons,0,'Cancelled touch must release buttons');
touch('pointerup',340,230,0);
touch('pointerdown',660,430,1);
assert.equal(input.mouse().buttons,0,'Outside touch must not leave a held button');
input.close();
console.log('PASS touch-pointer coordinate mapping, capture, release, cancellation and driving separation');
