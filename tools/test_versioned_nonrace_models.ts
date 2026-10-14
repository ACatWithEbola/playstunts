import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalIntroRenderer} from '../lib/game/intro-renderer.ts';
import {createOriginalCarMenuModel} from '../lib/game/car-menu-model.ts';
import type {OriginalRasterCall} from '../lib/game/drain-primitive-queue.ts';
const root=new URL('../public/game/',import.meta.url),read=(name:string)=>new Uint8Array(readFileSync(new URL(name,root))),json=(name:string)=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const baseline=read('native-render-resources.bin'),before=baseline.slice(),shapes=json('intro-shapes.json').resources,art=json('car-menu-art.json').resources,cars=json('assets.json').cars;
const introCalls:OriginalRasterCall[][]=[];
for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const renderer=createOriginalIntroRenderer(baseline,shapes,[1,2,3,4,5,6],engine),calls:OriginalRasterCall[]=[];
 renderer.render([0,0,0,0,0,1,1],{position:[0,0,128000],heading:0},call=>calls.push(call),true);
 assert.ok(calls.length>0);introCalls.push(calls);assert.deepEqual(baseline,before);
}
assert.deepEqual(introCalls[0],introCalls[1],'Default intro retains legacy commands');
let carRenderCases=0;
for(const car of cars){
 const bank=read('car-models/'+car.id.toLowerCase()+'.bin'),bankBefore=bank.slice(),outputs:Uint8Array[]=[];
 for(const engine of [undefined,'ms-1990','ms-1991'] as const){
  const model=createOriginalCarMenuModel(baseline,bank,art.stop,undefined,engine);
  const frames:Uint8Array[]=[];
  for(const angle of [0,128,256,384,512,640,768,896]){
   const pixels=new Uint8Array(65536);
   assert.ok(model.render(pixels,angle,0)>0);assert.ok(pixels.some(n=>n!==0));frames.push(pixels);carRenderCases++;
  }
  outputs.push(new Uint8Array(Buffer.concat(frames)));
  assert.deepEqual(baseline,before);assert.deepEqual(bank,bankBefore);
 }
 assert.deepEqual(outputs[0],outputs[1],'Default car display retains legacy pixels '+car.id);
}
console.log(JSON.stringify({introEngines:3,cars:cars.length,anglesPerCar:8,carRenderCases,legacyDefaultsIdentical:true,sourceUnchanged:true,originalPixelParityClaimed:false}));
