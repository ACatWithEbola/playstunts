import {originalBrowserKey} from './browser-menu-input.ts';
/** Blocking BIOS-style keyboard reads and nonblocking copy-loop polling for
 * native SETUP. Closing the view rejects a pending read immediately. */
export function createBrowserSetupInput(element:HTMLCanvasElement,signal:AbortSignal){
 const queue:number[]=[];let closed=false,waiting:{resolve(value:number):void;reject(error:Error):void}|undefined;
 const error=()=>new DOMException('Native SETUP closed','AbortError');
 const keyboard=(event:KeyboardEvent)=>{if(closed||event.metaKey||event.ctrlKey||event.altKey)return;const key=originalBrowserKey(event.key,event.shiftKey);if(!key)return;event.preventDefault();if(waiting){const pending=waiting;waiting=undefined;pending.resolve(key);}else queue.push(key);};
 const focus=()=>element.focus({preventScroll:true});
 const close=()=>{if(closed)return;closed=true;queue.length=0;waiting?.reject(error());waiting=undefined;element.removeEventListener('keydown',keyboard);element.removeEventListener('pointerdown',focus);signal.removeEventListener('abort',close);};
 element.addEventListener('keydown',keyboard);element.addEventListener('pointerdown',focus);signal.addEventListener('abort',close,{once:true});if(signal.aborted)close();
 return {key():Promise<number>{if(closed)return Promise.reject(error());if(queue.length)return Promise.resolve(queue.shift()!);if(waiting)return Promise.reject(Error('Overlapping native SETUP keyboard reads'));return new Promise((resolve,reject)=>{waiting={resolve,reject};});},pollKey(){if(closed)throw error();return queue.shift()??0;},close};
}
