import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserMenuInput} from '../lib/game/browser-menu-input.ts';
import {readFileSync} from 'node:fs';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {selectOriginalReplayControl} from '../lib/game/replay-control-selection.ts';
test('consumed menu activators remain held, but restart waits for physical release',async()=>{
 class Canvas extends EventTarget{style={};ownerDocument=new EventTarget();getBoundingClientRect(){return {left:0,top:0,width:320,height:200};}setPointerCapture(){}hasPointerCapture(){return false;}releasePointerCapture(){}focus(){}}
 const callbacks:FrameRequestCallback[]=[];
 Object.assign(globalThis,{window:new EventTarget(),requestAnimationFrame:(callback:FrameRequestCallback)=>{callbacks.push(callback);return 1;},cancelAnimationFrame:()=>{}});
 const canvas=new Canvas(),input=createBrowserMenuInput(canvas as unknown as HTMLCanvasElement);
 const key=(type:string,code:string,value:string)=>{const event=new Event(type);Object.defineProperties(event,{code:{value:code},key:{value},ctrlKey:{value:false},shiftKey:{value:false}});canvas.dispatchEvent(event);};
 const frame=async()=>{assert.ok(callbacks.length);callbacks.shift()!(0);for(let i=0;i<8;i++)await Promise.resolve();};
 for(const [code,value] of [['Enter','Enter'],['ArrowDown','ArrowDown'],['Space',' '],['KeyA','a']]){
  key('keydown',code,value);input.takeKey();assert.notEqual(input.controls(),0);
  let released=false;const wait=input.releaseDrivingInput().then(()=>{released=true;});await frame();assert.equal(released,false,'Consumed but held '+code+' must not start a restarted race');
  key('keyup',code,value);await frame();await wait;assert.equal(input.controls(),0);assert.equal(released,true);
 }
 input.close();
});
test('restart drains menu input before initialization and stays at zero until new driving input',async()=>{
 // Main has no website high-score fixture. Use the same original native
 // resources directly so this regression stays independent of the website.
 const root=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name+'.json',root),'utf8'));
 const fixtureData={base:new Uint8Array(readFileSync(new URL('native-resource-base.bin',root))),catalog:createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(new URL('original-resources/'+file,root)))),cars:json('assets').cars,records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects:json('track-objects'),points:json('route-point-vectors'),indices:json('route-speed-indices'),planes:json('collision-planes'),walls:json('collision-walls').walls};
 const replay=Array.from(readFileSync(new URL('replays/CTKFIN.RPL',root))),runtime=await createNativeManualRaceRuntime(fixtureData,{configuration:replay.slice(0,24),track:replay.slice(24,0x722),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 const d=0x2d1a0,devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
 runtime.session.skipIntroduction();for(let i=0;i<30;i++)runtime.tick(devices);runtime.session.seek(runtime.session.length);
 let releases=0;const host={resetCounter(){},resetMouse(){},async dialog(){return 1;},async releaseDrivingInput(){releases++;assert.equal(runtime.session.state.memory[d+0xa3c2],2,'Drain while still in replay, before fresh initialization');},selectControl(_mode:number,selected:number){selectOriginalReplayControl(runtime.session.state.memory,d,selected);}};
 await runtime.session.continueReplay(true,host);assert.equal(releases,1);
 for(let i=0;i<100;i++)runtime.tick({...devices,controls:()=>0});
 assert.equal(runtime.session.state.player.driving.race.stats[2],0);assert.equal(runtime.session.state.memory[d+0x8eab],0);assert.equal(runtime.session.length,0);
 runtime.tick(devices);assert.equal(runtime.session.state.memory[d+0x8eab],1);assert.equal(runtime.session.state.player.driving.race.stats[2],1);
 runtime.session.seek(runtime.session.length);await runtime.session.continueReplay(false,host);assert.equal(releases,1,'Continue driving must not use restart-only input drain');
});
