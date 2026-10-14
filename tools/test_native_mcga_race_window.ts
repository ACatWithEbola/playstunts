import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {nativeRaceRenderWindow} from '../lib/game/native-race-render-window.ts';
import {createNativeOriginalRenderer} from '../lib/game/native-original-renderer.ts';
import {selectOriginalSpriteWindow} from '../lib/game/select-sprite-window.ts';
import {analyzeRoute} from '../lib/physics/route-analysis.ts';
import {prepareOriginalRaceViewport} from '../lib/game/race-viewport.ts';
const replay=readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url));
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const race=await createNativeManualRaceSession({...fixtureData,physicsEngine},{configuration:Array.from(replay.slice(0,24)),track:Array.from(replay.slice(24,0x722)),name:'WINDOW',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 const memory=race.session.state.memory,before=memory.slice(),window=nativeRaceRenderWindow(memory,0x2d1a0,'mcga'),v=new DataView(memory.buffer),base=window.bitmap.segment*16;
 assert.equal(v.getUint16(base,true),320);assert.equal(v.getUint16(base+2,true),200);assert.ok(base+16+64000<=memory.length);
 const descriptor=window.window.segment*16+window.window.offset,rows=v.getUint16(descriptor+10,true),cs=0x209e0;
 assert.equal(v.getUint16(cs+rows,true),16);assert.equal(v.getUint16(cs+rows+199*2,true),16+199*320);
 assert.deepEqual(memory,before,'Resolving allocated window must not write into the race');
 const analysis=analyzeRoute(race.raw,fixtureData.records,fixtureData.vectors,fixtureData.samples,fixtureData.objects,undefined,{sample:false});
 const options={allocatedResources:true,originalViewport:true,physicsEngine};
 const direct=createNativeOriginalRenderer(memory,race.raw,analysis,options),retained=createNativeOriginalRenderer(memory,race.raw,analysis,options),input=memory.slice();prepareOriginalRaceViewport(input,0x2d1a0,0xeefe);
 const inputBefore=input.slice(),expected=direct.render(input).slice();let actual:Uint8Array|undefined;
 retained.render(input,undefined,undefined,undefined,false,(renderMemory,world)=>{const header=renderMemory.slice(base,base+16);selectOriginalSpriteWindow(renderMemory,window.window.offset,window.window.segment);world();assert.deepEqual(renderMemory.slice(base,base+16),header,'Background drawing must preserve the bitmap header');actual=renderMemory.slice(base+16,base+16+64000);});
 assert.deepEqual(actual,expected,'Actual MCGA retained window raster matches direct framebuffer');assert.deepEqual(input,inputBefore);assert.deepEqual(memory,before);
 console.log(`${physicsEngine}: actual allocated MCGA race window has320x200 bitmap and header-adjusted scanlines`);
}
