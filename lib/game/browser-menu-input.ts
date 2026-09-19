import {writeOriginalMenuDeviceSample} from './menu-device-memory.ts';
import {pollOriginalMenuDevices,type OriginalMenuDeviceState} from './menu-device-input.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR,ORIGINAL_GAME_TIMER_DIVIDER} from './timer-interrupt.ts';
import {originalJoystickSteering} from './joystick-steering.ts';
import {originalDrivingKeyControls} from './driving-key-controls.ts';
import {originalKeyboardScanWord} from './keyboard-scan-word.ts';
import {replayKeyboardHoldButtons} from './replay-keyboard-hold.ts';
/** Browser hardware boundary for the native original polling routine. */
export function originalBrowserKey(key:string,shift=false){
 const functionKey=/^F([1-9]|10)$/.exec(key);if(functionKey)return ((shift?0x54:0x3b)+Number(functionKey[1])-1)<<8;
 const special:Record<string,number>={Enter:13,Escape:27,Tab:9,Backspace:8,ArrowUp:0x4800,ArrowDown:0x5000,ArrowLeft:0x4b00,ArrowRight:0x4d00,Home:0x4700,End:0x4f00,Insert:0x5200,Delete:0x5300,PageUp:0x4900,PageDown:0x5100};
 return special[key]??(key.length===1&&key.charCodeAt(0)<256?key.charCodeAt(0):0);
}
const scanCodes:Record<string,number>={Escape:1,Minus:12,Equal:13,Backspace:14,Tab:15,BracketLeft:26,BracketRight:27,Enter:28,NumpadEnter:28,ControlLeft:29,ControlRight:29,Semicolon:39,Quote:40,Backquote:41,ShiftLeft:42,Backslash:43,Comma:51,Period:52,Slash:53,NumpadDivide:53,ShiftRight:54,NumpadMultiply:55,AltLeft:56,AltRight:56,Space:57,CapsLock:58,NumLock:69,ScrollLock:70,Numpad7:71,Home:71,Numpad8:72,ArrowUp:72,Numpad9:73,PageUp:73,NumpadSubtract:74,Numpad4:75,ArrowLeft:75,Numpad5:76,Numpad6:77,ArrowRight:77,NumpadAdd:78,Numpad1:79,End:79,Numpad2:80,ArrowDown:80,Numpad3:81,PageDown:81,Numpad0:82,Insert:82,NumpadDecimal:83,Delete:83,F11:87,F12:88};
for(const [letters,start] of [['QWERTYUIOP',16],['ASDFGHJKL',30],['ZXCVBNM',44]] as const)Array.from(letters).forEach((letter,i)=>{scanCodes['Key'+letter]=start+i;});
Array.from('1234567890').forEach((digit,i)=>{scanCodes['Digit'+digit]=2+i;});for(let i=1;i<=10;i++)scanCodes['F'+i]=58+i;
export function createBrowserMenuInput(element:HTMLCanvasElement,options:{joystickEnabled?:()=>boolean;drivingBindings?:()=>ArrayLike<number>;onPoll?:()=>void|Promise<void>}={}){
 let active=true,controlHeld=false,pendingKey=0;
 let disposed=false,x=160,y=100,buttons=0,last=0,lastPoll=0,request=0,rejectWait:((error:Error)=>void)|undefined;
 const epoch=performance.now(),held=new Set<number>(),pointerEdges:{x:number;y:number;buttons:number}[]=[];
 let state:OriginalMenuDeviceState={counter:0,mouseTime:0,joystickTime:0,joystick:0,pressedJoystick:0,x,y,buttons:0,mouseIdle:0,joystickKey:0,mouseKey:0,mouseAvailable:true,mouseActive:false,cursorVisible:false};
 // The original IRQ9 handler shares a scan bit between aliases and retains
 // only the latest unread key (DS:43d6 is two bytes in the supplied game).
 const scanHeld=(scan:number)=>active&&held.has(scan);
 const replayActivationButtons=()=>replayKeyboardHoldButtons(scanHeld(57),scanHeld(28));
 const takeKey=()=>{const key=pendingKey;pendingKey=0;return key;};
 const page=element.ownerDocument??(typeof document==='undefined'?undefined:document);
 const counter=()=>Math.floor((performance.now()-epoch)*PC_PIT_INPUT_HZ/(ORIGINAL_PIT_DIVISOR*1000));
 const wait=async()=>{await new Promise<void>((resolve,reject)=>{if(disposed){reject(new DOMException('Native menu closed','AbortError'));return;}rejectWait=reject;request=requestAnimationFrame(()=>{rejectWait=undefined;resolve();});});await options.onPoll?.();};
 const keyboard=(event:KeyboardEvent)=>{if(disposed)return;controlHeld=event.ctrlKey;const scan=scanCodes[event.code];if(scan!==undefined){held.add(scan);controlHeld=held.has(29);}if(!active)return;const key=scan===undefined?originalBrowserKey(event.key,event.shiftKey):originalKeyboardScanWord(scan,scanHeld);if(scan!==undefined||key!==0)pendingKey=key;if(key)event.preventDefault();};
 const keyup=(event:KeyboardEvent)=>{if(disposed)return;controlHeld=event.ctrlKey;const scan=scanCodes[event.code];if(scan!==undefined){held.delete(scan);controlHeld=held.has(29);}};
 // Cursor styling stays scoped to the canvas: releasing capture lets the
 // surrounding page supply its normal cursor without losing game cursor state.
 let blockedButtons=0,capturedPointer:number|undefined;
 const releaseCapture=()=>{const id=capturedPointer;capturedPointer=undefined;if(id!==undefined&&element.hasPointerCapture?.(id))element.releasePointerCapture(id);};
 let mouseBounds=[0,319,0,199];
 const leave=(event:PointerEvent)=>{if(disposed)return;if(capturedPointer===event.pointerId)capturedPointer=undefined;blockedButtons|=buttons|(event.buttons&7);if(active&&buttons)pointerEdges.push({x,y,buttons:0});buttons=0;if(active&&element.hasPointerCapture?.(event.pointerId))element.releasePointerCapture(event.pointerId);};
 const pointer=(event:PointerEvent)=>{if(disposed)return;const rect=element.getBoundingClientRect();const outside=event.clientX<rect.left||event.clientX>=rect.left+rect.width||event.clientY<rect.top||event.clientY>=rect.top+rect.height;x=Math.max(mouseBounds[0],Math.min(mouseBounds[1],Math.floor((event.clientX-rect.left)*320/rect.width)));y=Math.max(mouseBounds[2],Math.min(mouseBounds[3],Math.floor((event.clientY-rect.top)*200/rect.height)));if(outside){leave(event);return;}blockedButtons&=event.buttons&7;const next=(event.buttons&7)&~blockedButtons;if(active&&next!==buttons)pointerEdges.push({x,y,buttons:next});buttons=next;};
 const down=(event:PointerEvent)=>{pointer(event);if(!active)return;event.preventDefault();element.focus({preventScroll:true});element.setPointerCapture(event.pointerId);capturedPointer=event.pointerId;};
 const contextMenu=(event:MouseEvent)=>{if(active)event.preventDefault();};
 const clear=()=>{blockedButtons|=buttons;controlHeld=false;buttons=0;pendingKey=0;held.clear();pointerEdges.length=0;releaseCapture();};
 const visibility=()=>{if(page?.hidden)clear();};
 page?.addEventListener('visibilitychange',visibility);
 page?.addEventListener('fullscreenchange',clear);
 element.addEventListener('keydown',keyboard);element.addEventListener('keyup',keyup);element.addEventListener('blur',clear);element.addEventListener('pointerdown',down);element.addEventListener('pointermove',pointer);element.addEventListener('pointerup',pointer);element.addEventListener('pointercancel',leave);element.addEventListener('lostpointercapture',leave);element.addEventListener('pointerleave',leave);element.addEventListener('contextmenu',contextMenu);window.addEventListener('blur',clear);
 // A browser may retarget a release during a fullscreen or browser-chrome
 // transition without first blurring the canvas. Catch releases at the window
 // boundary so an old direction cannot remain combined with the next one.
 window.addEventListener('keyup',keyup,true);
 const gamepad=()=>{
  // Original225bc returns no joystick sample while DS:4602 bit0 is clear.
  if(!active||disposed||(options.joystickEnabled&&!options.joystickEnabled()))return {mask:0,direction:0,axis:0};
  const pad=Array.from(navigator.getGamepads?.()??[]).find(p=>p?.connected);if(!pad)return {mask:0,direction:0,axis:0};
  const horizontal=pad.axes[0]??0,vertical=pad.axes[1]??0,pressed=(i:number)=>!!pad.buttons[i]?.pressed;
  const left=horizontal<-.5||pressed(14),right=horizontal>.5||pressed(15),up=vertical<-.5||pressed(12),down=vertical>.5||pressed(13);
  return {axis:Math.max(-1,Math.min(1,horizontal)),mask:(up?1:0)|(down?2:0)|(right?4:0)|(left?8:0)|(pressed(0)?32:0)|(pressed(1)?16:0),direction:up?(left?8:right?2:1):down?(left?6:right?4:5):left?7:right?3:0};
 };
 const readImmediate=(deltaOverride?:number|(()=>number))=>{
  const now=counter(),delta=deltaOverride===undefined?(now-last)&65535:(typeof deltaOverride==='function'?deltaOverride():deltaOverride)&65535;last=now;lastPoll=now;const pad=gamepad(),pointer=pointerEdges.shift()??{x,y,buttons:active?buttons:0};
  const result=pollOriginalMenuDevices(state,{delta,key:takeKey(),joystick:pad.mask,rawButtons:pad.mask,...pointer});state=result.state;
  if(result.cursor.length)element.style.cursor=state.cursorVisible?'url("/site/original-pointer.png") 0 0, auto':'none';
  return {key:result.key,delta,...pointer,mouseActive:state.mouseActive,rawButtons:result.rawButtons,joystickDirection:pad.direction,joystickButtons:pad.mask&48};
 };
 const read=async(deltaOverride?:number|(()=>number))=>{await wait();return readImmediate(deltaOverride);};
 return {
  read,readImmediate,counter,elapsedSinceInputPoll:()=>counter()-lastPoll,nextFrame:wait,ctrlHeld:()=>active&&controlHeld,takeKey,replayActivationButtons,
  keyDown:(scan:number)=>Number(scanHeld(scan&255)),
  mouse:()=>({x,y,buttons:active?buttons:0}),
  joystickButtons:()=>gamepad().mask&48,
  // The browser gamepad is a calibrated virtual axis:0..62, centre31.
  joystickSteering:()=>originalJoystickSteering(Math.round((gamepad().axis+1)*31),0,256),
  resetMouse(mode=1){mouseBounds=mode?[24,296,0,200]:[0,320,0,200];if(mode){x=160;y=100;}pointerEdges.length=0;},
  controls:()=>originalDrivingKeyControls(options.drivingBindings?.()??[57,28,71,72,73,77,81,80,79,75],scan=>scanHeld(scan)||(scan===57&&scanHeld(30))||(scan===28&&scanHeld(44)),()=>gamepad().mask),
  // Original resource/menu handovers retain IRQ9 scan bits. Inactive adapters
  // track physical releases and pointer movement without queuing inactive
  // actions for their next screen. Physical mouse holds survive handover too.
  // Capture ownership moves to the next adapter on this same canvas; closing
  // the inactive adapter must not release the new screen's capture.
  setActive(value:boolean){active=value;pendingKey=0;pointerEdges.length=0;last=counter();if(!value){capturedPointer=undefined;element.style.cursor='';}},
  async readMemory(memory:()=>Uint8Array,dataSegment:number,deltaOverride?:number|(()=>number)){const sample=await read(deltaOverride);return writeOriginalMenuDeviceSample(memory(),dataSegment,sample);},
  async waitTicks(ticks:number){const end=counter()+ticks;while(counter()<end)await wait();},
  counters:()=>({input:counter()>>>0,game:Math.floor(counter()/ORIGINAL_GAME_TIMER_DIVIDER)>>>0}),
  async keyboard(){await wait();const ticks=counter();return {key:takeKey(),input:ticks>>>0,game:Math.floor(ticks/ORIGINAL_GAME_TIMER_DIVIDER)>>>0};},
  async gameCounter(){await wait();return Math.floor(counter()/ORIGINAL_GAME_TIMER_DIVIDER)>>>0;},
  async release(){for(;;){if(gamepad().mask&48){await wait();continue;}const sample=await read();if(!sample.key&&!(sample.mouseActive&&sample.buttons&3))return;}},
  close(){if(disposed)return;const ownedCursor=active;disposed=true;active=false;clear();page?.removeEventListener('visibilitychange',visibility);page?.removeEventListener('fullscreenchange',clear);cancelAnimationFrame(request);rejectWait?.(new DOMException('Native menu closed','AbortError'));element.removeEventListener('keydown',keyboard);element.removeEventListener('keyup',keyup);element.removeEventListener('blur',clear);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',pointer);element.removeEventListener('pointerup',pointer);element.removeEventListener('pointercancel',leave);element.removeEventListener('lostpointercapture',leave);element.removeEventListener('pointerleave',leave);element.removeEventListener('contextmenu',contextMenu);window.removeEventListener('blur',clear);window.removeEventListener('keyup',keyup,true);if(ownedCursor)element.style.cursor='';},
 };
}
