import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runBrowserNativeDemo} from '../lib/game/browser-native-demo.ts';
import {fixtureData} from './global-score-fixture.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {createBrowserLegacyTandyVirtualBackend} from '../lib/game/browser-legacy-tandy-virtual-backend.ts';
const legacyVirtual=process.argv.includes('--legacy-virtual');
const keys=['window','document','navigator','requestAnimationFrame','cancelAnimationFrame'] as const;
const previous=keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
const drawing={createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},setTransform(){},drawImage(){},imageSmoothingEnabled:false};
class Canvas extends EventTarget{width=320;height=200;style={cursor:''};dataset:Record<string,string>={};ownerDocument=new EventTarget();getContext(){return drawing;}focus(){}getBoundingClientRect(){return {left:0,top:0,width:320,height:200};}}
const base=fixtureData.base.slice(),palette=JSON.parse(readFileSync('public/game/track-materials.json','utf8')).palette;
const lifecycles=process.argv.includes('--natural')?['natural'] as const:['return','abort'] as const;
try{for(const physics of ['ms-1990','ms-1991'] as const)for(const generation of ['ms-1990','ms-1991'] as const)for(const lifecycle of lifecycles){
 if(legacyVirtual&&generation!=='ms-1990')continue;
 const bytes=physics==='ms-1991'?versionedDemoResource(physics)!.bytes:readFileSync('public/game/replays/CTKFIN.RPL'),before=bytes.slice(),controller=new AbortController(),canvas=new Canvas(),buffers:Float32Array[]=[],sources:any[]=[];let frames=0,disconnects=0;
 const context={sampleRate:48000,currentTime:0,state:'running',destination:{},async resume(){},createGain(){return {gain:{value:1},connect(){},disconnect(){disconnects++;}};},createBuffer(){return {copyToChannel(pcm:Float32Array){buffers.push(pcm.slice());}};},createBufferSource(){const source={buffer:null as unknown,onended:null as unknown,stopped:0,disconnected:0,connect(){},start(){},stop(){this.stopped++;},disconnect(){this.disconnected++;}};sources.push(source);return source;}};
 const win=Object.assign(new EventTarget(),{location:{hostname:'localhost',search:`?play-engine=${physics}`}});
 for(const [key,value] of Object.entries({window:win,document:{createElement:()=>new Canvas()},navigator:{getGamepads:()=>[]},requestAnimationFrame:(callback:()=>void)=>{queueMicrotask(()=>{context.currentTime+=.05;callback();});return 1;},cancelAnimationFrame:()=>{}}))Object.defineProperty(globalThis,key,{configurable:true,value});
 const menu={configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:true};
 const legacyBackend=legacyVirtual?createBrowserLegacyTandyVirtualBackend(context.sampleRate):undefined;
 const running=runBrowserNativeDemo({legacyTandyBinding:legacyBackend,canvas:canvas as unknown as HTMLCanvasElement,context:context as unknown as AudioContext,data:{...fixtureData,palette,soundDevice:{kind:'tandy',driverGeneration:generation,port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}},menu,signal:controller.signal,onFrame(){
  frames++;if(frames>10000)controller.abort();if(frames===10){if(lifecycle==='abort')controller.abort();else if(lifecycle==='return')for(const type of ['keydown','keyup'])canvas.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{key:'Enter',code:'Enter',ctrlKey:false,shiftKey:false}));}
 }});
 if(lifecycle==='abort'){await assert.rejects(running,{name:'AbortError'});assert.equal(canvas.dataset.nativeDemo,'closed');}
 else{const restored=await running;assert.deepEqual(restored.configuration,menu.configuration);assert.deepEqual(restored.track,menu.track);assert.equal(canvas.dataset.nativeDemo,'complete');}
 assert.ok(frames>=10);if(lifecycle==='natural'){assert.ok(frames>10);assert.equal(controller.signal.aborted,false);}assert.ok(buffers.length>0);assert.ok(buffers.every(buffer=>buffer.length===512&&buffer.every(Number.isFinite)));
 assert.equal(disconnects,1);assert.ok(sources.every(source=>source.buffer===null&&source.stopped===1&&source.disconnected===1));assert.deepEqual(bytes,before);
 if(legacyBackend)assert.throws(()=>legacyBackend.render(1),/unavailable/);
 console.log(`${physics}/${generation}/${lifecycle}: ${frames} presented frames; browser demo restores/aborts and releases queued Tandy output; no preview query, mocked browser surfaces`);
}}finally{for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
assert.deepEqual(fixtureData.base,base);
