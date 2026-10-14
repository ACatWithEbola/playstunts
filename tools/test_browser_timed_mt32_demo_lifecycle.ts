import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runBrowserNativeDemo} from '../lib/game/browser-native-demo.ts';
import {fixtureData} from './global-score-fixture.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
const keys=['window','document','navigator','requestAnimationFrame','cancelAnimationFrame'] as const;
const previous=keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
const drawing={createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},setTransform(){},drawImage(){},imageSmoothingEnabled:false};
class Canvas extends EventTarget{width=320;height=200;style={cursor:''};dataset:Record<string,string>={};ownerDocument=new EventTarget();getContext(){return drawing;}focus(){}getBoundingClientRect(){return {left:0,top:0,width:320,height:200};}}
const demo=versionedDemoResource('ms-1991')!,before=demo.bytes.slice(),base=fixtureData.base.slice();
const delayedFrame=process.argv.includes('--delayed-frame');
const graphicsCloseFailure=process.argv.includes('--graphics-close-failure');
try{for(const generation of ['ms-1990','ms-1991'] as const)for(const lifecycle of ['finish','abort'] as const){
 if(graphicsCloseFailure&&lifecycle!=='abort')continue;
 const module=await createMunt({wasmBinary:readFileSync('public/game/mt32-local/munt.wasm'),print(){},printErr(){}});
 const device=createMt32WasmOutput(module as unknown as Mt32Wasm,readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),readFileSync('public/game/mt32-local/pcm_mt32.rom'));
 const controller=new AbortController(),canvas=new Canvas();let stopped=0,frames=0,requests=0,delayActive=false,duringDelay=0;
 const context={currentTime:0,state:'running',destination:{},async resume(){},createGain(){return {gain:{value:1},connect(){},disconnect(){}};},createBuffer(_n:number,count:number){return {getChannelData:()=>new Float32Array(count)};},createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}};}};
 const win=Object.assign(new EventTarget(),{location:{hostname:'localhost',search:'?play-engine=ms-1991'}});
 for(const [key,value] of Object.entries({window:win,document:{createElement:()=>new Canvas()},navigator:{getGamepads:()=>[]},requestAnimationFrame:(callback:()=>void)=>{requests++;if(delayedFrame&&requests===3){delayActive=true;const clock=setInterval(()=>{context.currentTime+=.01;},10);setTimeout(()=>{clearInterval(clock);delayActive=false;context.currentTime+=.05;callback();},90);}else queueMicrotask(()=>{context.currentTime+=.05;callback();});return 1;},cancelAnimationFrame:()=>{}}))Object.defineProperty(globalThis,key,{configurable:true,value});
 const menu={configuration:Array.from(demo.bytes.subarray(0,24)),track:Array.from(demo.bytes.subarray(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:true};
 let resets=0;
 const graphicsSwitch=graphicsCloseFailure?{enabled:false,resetPerformance(){if(++resets>1)throw Error('Graphics cleanup failed');}}:undefined;
 try{
  const result=runBrowserNativeDemo({graphicsSwitch,canvas:canvas as unknown as HTMLCanvasElement,context:context as unknown as AudioContext,data:{...fixtureData,palette:JSON.parse(readFileSync('public/game/track-materials.json','utf8')).palette,soundDevice:{kind:'mt32',driverGeneration:generation,execute:virtual}},menu,signal:controller.signal,timedMt32:{device,generation,onScheduled(){if(delayActive)duringDelay++;},patch:readFileSync('public/game/original-resources/MT32.PLB'),profile:{cpuHz:4772728,pollCycles:20,resetClocks:16705,initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}},async stopMusic(){stopped++;}},onFrame(){frames++;if(lifecycle==='abort'&&frames===10)controller.abort();}});
  if(lifecycle==='abort'){await assert.rejects(result,graphicsCloseFailure?/Graphics cleanup failed/:{name:'AbortError'});assert.equal(canvas.dataset.nativeDemo,'closed');}
  else{const restored=await result;assert.deepEqual(restored.configuration,menu.configuration);assert.deepEqual(restored.track,menu.track);assert.equal(canvas.dataset.nativeDemo,'complete');}
  assert.equal(stopped,1);assert.ok(frames>0);assert.equal(device.active(),false);assert.ok(device.render(512).every(value=>value===0));
  if(delayedFrame){if(generation==='ms-1991')assert.ok(duringDelay>0,'Modern demo must deliver audio before delayed display wakeup');else assert.equal(duringDelay,0,'Legacy frame delivery remains unchanged');console.log(`${generation}/${lifecycle}: ${duringDelay} buffers delivered during delayed rAF`);}
  console.log(`${generation}/${lifecycle}: production browser demo entrypoint restores/aborts and releases real synthesizer silently; mocked browser surfaces`);
 }finally{device.close();}
}}finally{for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
assert.deepEqual(demo.bytes,before);assert.deepEqual(fixtureData.base,base);
