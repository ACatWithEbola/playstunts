import type { CommandInterface, Emulators, DosConfig } from 'emulators';
declare global {interface Window {emulators:Emulators}}
const keys:Record<string,number>={Escape:256,Enter:257,Tab:258,Backspace:259,Insert:260,Delete:261,ArrowRight:262,ArrowLeft:263,ArrowDown:264,ArrowUp:265,PageUp:266,PageDown:267,Home:268,End:269,ShiftLeft:340,ShiftRight:344,ControlLeft:341,ControlRight:345,AltLeft:342,AltRight:346,Space:32,Comma:44,Period:46,Slash:47,Minus:45,Equal:61,Semicolon:59,Quote:39,BracketLeft:91,BracketRight:93,Backslash:92};
export function keyCode(code:string){if(keys[code]!==undefined)return keys[code];if(/^Key[A-Z]$/.test(code))return code.charCodeAt(3);if(/^Digit[0-9]$/.test(code))return code.charCodeAt(5);if(/^F([1-9]|1[0-2])$/.test(code))return 289+Number(code.slice(1));return undefined}
let library:Promise<void>|undefined;
function load(){return library??=new Promise((resolve,reject)=>{if(window.emulators)return resolve();const s=document.createElement('script');s.src='/emulator/emulators.js';s.onload=()=>resolve();s.onerror=()=>{library=undefined;reject(Error('The game engine could not be downloaded. Please try again.'))};document.head.appendChild(s)})}
async function database(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('stunts-browser-reference',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
type SavedDisk={archive:Uint8Array;setup:string};
async function stored(){const db=await database();try{return await new Promise<SavedDisk|null>((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').get('disk');r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error)})}finally{db.close()}}
async function store(bytes:SavedDisk){const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('saves','readwrite');t.objectStore('saves').put(bytes,'disk');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error)})}finally{db.close()}}
export interface Reference{ci:CommandInterface;save:()=>Promise<void>;stop:()=>Promise<void>;volume:(v:number)=>void;release:()=>void}
export async function startReference(canvas:HTMLCanvasElement,audio:AudioContext,setup:boolean,notice:(s:string)=>void):Promise<Reference>{
 await load();notice('Loading your original game…');window.emulators.pathPrefix='/emulator/';
 const r=await fetch('/game/stunts.jsdos');if(!r.ok)throw Error('The game files could not be loaded.');const bytes=new Uint8Array(await r.arrayBuffer());
 const config=await window.emulators.bundleConfig(bytes) as DosConfig;if(!config)throw Error('Missing game configuration.');

 const disk=await stored().catch(()=>{notice('Browser storage is unavailable; saved files will last for this session only.');return null});
 const command='stunts.com';
 config.dosboxConf=config.dosboxConf.split('[autoexec]')[0]+'[autoexec]\n@echo off\nmount c .\nc:\n'+(setup?'setup.exe\necho Setup complete. Use Back in the browser to save your settings.\npause':command+'\necho Game closed. Use Back in the browser to save your files.\npause')+'\n';
 const configured=await window.emulators.bundleUpdateConfig(disk?.archive??bytes,config);
 const ci=await window.emulators.dosboxWorker(configured);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx){await ci.exit();throw Error('Your browser could not create the game display.')}
 let stopped=false,alive=true,nextAudio=0;const gain=audio.createGain();gain.gain.value=.8;gain.connect(audio.destination);const sources=new Set<AudioBufferSourceNode>();
 ci.events().onFrame((rgb,rgba)=>{if(!alive)return;const w=ci.width(),h=ci.height();if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}const pixels=new Uint8ClampedArray(w*h*4);if(rgba)pixels.set(rgba);else if(rgb)for(let i=0;i<w*h;i++){pixels[i*4]=rgb[i*3];pixels[i*4+1]=rgb[i*3+1];pixels[i*4+2]=rgb[i*3+2]}for(let i=3;i<pixels.length;i+=4)pixels[i]=255;ctx.putImageData(new ImageData(pixels,w,h),0,0)});
 ci.events().onSoundPush(samples=>{if(!alive||audio.state!=='running')return;const frequency=ci.soundFrequency();if(!frequency||!samples.length)return;if(nextAudio>audio.currentTime+.25)return;const b=audio.createBuffer(1,samples.length,frequency);b.copyToChannel(Float32Array.from(samples),0);const source=audio.createBufferSource();source.buffer=b;source.connect(gain);sources.add(source);source.onended=()=>sources.delete(source);nextAudio=Math.max(nextAudio,audio.currentTime+.025);source.start(nextAudio);nextAudio+=b.duration});
 const held=new Set<number>();const release=()=>{held.forEach(k=>ci.sendKeyEvent(k,false));held.clear()};
 const down=(e:KeyboardEvent)=>{if(e.metaKey)return;const k=keyCode(e.code);if(k===undefined)return;e.preventDefault();if(!held.has(k)){held.add(k);ci.sendKeyEvent(k,true)}void audio.resume()};
 const up=(e:KeyboardEvent)=>{const k=keyCode(e.code);if(k!==undefined&&held.has(k)){e.preventDefault();held.delete(k);ci.sendKeyEvent(k,false)}};
 const move=(e:MouseEvent)=>{const b=canvas.getBoundingClientRect();ci.sendMouseMotion(Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),Math.max(0,Math.min(1,(e.clientY-b.top)/b.height)))};
 const press=(e:MouseEvent)=>{canvas.focus();move(e);ci.sendMouseButton(e.button===2?1:0,true);void audio.resume()};const lift=(e:MouseEvent)=>ci.sendMouseButton(e.button===2?1:0,false);const context=(e:MouseEvent)=>e.preventDefault();
 canvas.addEventListener('keydown',down);canvas.addEventListener('keyup',up);canvas.addEventListener('blur',release);window.addEventListener('blur',release);canvas.addEventListener('mousemove',move);canvas.addEventListener('mousedown',press);window.addEventListener('mouseup',lift);canvas.addEventListener('contextmenu',context);
 let saving:Promise<void>|null=null;const save=()=>saving??=(async()=>{const archive=await ci.persist(false);const setup=new TextDecoder().decode(await ci.fsReadFile('SETUP.DAT'));if(archive)await store({archive,setup})})().finally(()=>saving=null);
 const timer=setInterval(()=>{if(alive)void save().catch(()=>notice('Could not save to this browser. Keep this tab open.'))},30000);
 ci.events().onExit(()=>{alive=false;clearInterval(timer);notice('The game has closed. Use Restart to play again.')});
 canvas.focus();notice(setup?'Original setup — choose hardware, select Exit, then use Back to save your settings.':'Press Enter to pass the opening screens, then choose Let’s Drive.');
 return {ci,save,release,volume:v=>{gain.gain.value=v},stop:async()=>{if(stopped)return;if(alive)await save();stopped=true;clearInterval(timer);release();canvas.removeEventListener('keydown',down);canvas.removeEventListener('keyup',up);canvas.removeEventListener('blur',release);window.removeEventListener('blur',release);canvas.removeEventListener('mousemove',move);canvas.removeEventListener('mousedown',press);window.removeEventListener('mouseup',lift);canvas.removeEventListener('contextmenu',context);try{if(alive)await ci.exit()}finally{alive=false;sources.forEach(s=>{try{s.stop()}catch{}});gain.disconnect();await audio.close()}}};
}
