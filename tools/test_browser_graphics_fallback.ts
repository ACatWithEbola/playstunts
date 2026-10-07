import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fallbackToOriginalGraphics,GRAPHICS_UNAVAILABLE_NOTICE} from '../lib/game/browser-graphics-fallback.ts';
import {translateWebsite} from '../lib/website-languages.ts';

await test('a failed renderer is attempted once, then native frames continue unchanged',()=>{
 let attempts=0,originalFrames=0,closed=0,notifications=0;
 const state={enabled:true,chaseCamera:3 as 0|1|2|3,notice:(text:string)=>assert.equal(text,GRAPHICS_UNAVAILABLE_NOTICE),unavailable:()=>notifications++};
 const memory=new Uint8Array([1,2,3]);const before=memory.slice();
 for(let frame=0;frame<20;frame++){
  if(state.enabled){try{attempts++;throw Error('WebGL creation failed');}catch{fallbackToOriginalGraphics(state,()=>closed++);}}
  if(!state.enabled)originalFrames++;
 }
 assert.equal(attempts,1);assert.equal(closed,1);assert.equal(notifications,1);assert.equal(originalFrames,20);assert.equal(state.chaseCamera,0);assert.deepEqual(memory,before);
});
await test('cleanup errors cannot prevent fallback and users can explicitly retry',()=>{
 let reset=0;const state={enabled:true,resetPerformance:()=>reset++};
 assert.doesNotThrow(()=>fallbackToOriginalGraphics(state,()=>{throw Error('lost context');}));
 assert.equal(state.enabled,false);assert.equal(reset,1);state.enabled=true;assert.equal(state.enabled,true);
});
await test('intro and demonstration use recovery, and the notice is visible and translated',()=>{
 const opening=readFileSync('app/OpeningSequence.tsx','utf8'),demo=readFileSync('lib/game/browser-native-demo.ts','utf8');
 assert.ok(opening.includes('catch{fallbackToOriginalGraphics(graphics.current'));
 assert.ok(demo.includes('catch{fallbackToOriginalGraphics(graphics,'));
 assert.ok(opening.includes('graphicsNotice===GRAPHICS_UNAVAILABLE_NOTICE?"original-track-explanation":"sr-only"'));
 for(const locale of ['es','it'] as const)assert.notEqual(translateWebsite(GRAPHICS_UNAVAILABLE_NOTICE,locale),GRAPHICS_UNAVAILABLE_NOTICE);
});

await test('actual intro presentation falls back on the same frame without retrying',()=>{
 const line=readFileSync('app/OpeningSequence.tsx','utf8').split('\n').find(line=>line.trim().startsWith('const displayAnimation='))!.trim();
 for(const fails of [true,false]){
  let attempts=0,originalDraws=0,enhancedDraws=0;
  const originalSurface={},upgradedSurface={},graphics={current:{enabled:true}},context={setTransform(){},imageSmoothingEnabled:false,drawImage(surface:object){if(surface===originalSurface)originalDraws++;else enhancedDraws++;}};
  const createUpgradedIntro=()=>{attempts++;if(fails)throw Error('FEATURE_FAILURE_WEBGL_GLERR_2');return {draw:()=>({}),close(){}};};
  const factory=new Function('graphics','createUpgradedIntro','fallbackToOriginalGraphics','context','originalSurface','upgradedSurface',
   'let introGpu;const lastDraw=[1],lastPose={},renderer={memory:new Uint8Array()},introMaterials={},element={width:1280,height:800},upgradedContext={setTransform(){},drawImage(){}};'+line+'return displayAnimation;');
  const draw=factory(graphics,createUpgradedIntro,fallbackToOriginalGraphics,context,originalSurface,upgradedSurface);
  for(let frame=0;frame<20;frame++)draw();
  assert.equal(attempts,1);assert.equal(originalDraws,fails?20:0);assert.equal(enhancedDraws,fails?0:20);assert.equal(graphics.current.enabled,!fails);
 }
});

await test('actual demo presentation does not recreate a failed WebGL context',()=>{
 const line=readFileSync('lib/game/browser-native-demo.ts','utf8').split('\n').find(line=>line.trim().startsWith('const redraw='))!.trim();
 let attempts=0,originalDraws=0;
 const graphics={enabled:true},drawing={setTransform(){},imageSmoothingEnabled:false,drawImage(){originalDraws++;}};
 const createUpgradedRaceScene=()=>{attempts++;throw Error('WebGL creation failed');};
 const factory=new Function('graphics','drawing','createUpgradedRaceScene','fallbackToOriginalGraphics',
  'let upgraded,upgradedFrame=-1;const options={assets:{}},runtime={frame:0,session:{state:{memory:new Uint8Array()}}},canvas={width:1280,height:800},surface={},alternate=undefined,presentHercules=undefined;'+line+'return redraw;');
 const draw=factory(graphics,drawing,createUpgradedRaceScene,fallbackToOriginalGraphics);
 for(let frame=0;frame<20;frame++)draw();
 assert.equal(attempts,1);assert.equal(originalDraws,20);assert.equal(graphics.enabled,false);
});
