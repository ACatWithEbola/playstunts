import assert from 'node:assert/strict';
import {originalCircleHeight} from '../lib/game/original-circle-height.ts';
import {originalCirclePlan} from '../lib/game/original-circle-plan.ts';
import {rasterOriginalDrawCall} from '../lib/game/raster-original-draw-call.ts';
for(let diameter=0;diameter<65536;diameter++){
 const quarter=diameter>>>2,legacy=(diameter-quarter+(quarter>>>1))<<16>>16,modern=(diameter-quarter+(quarter>>>2))<<16>>16;
 assert.equal(originalCircleHeight(diameter),legacy);assert.equal(originalCircleHeight(diameter,'ms-1990'),legacy);assert.equal(originalCircleHeight(diameter,'ms-1991'),modern);
}
const memory=new Uint8Array(65536),view=new DataView(memory.buffer);view.setUint16(0x3bc8,1,true);
const before=memory.slice();
assert.deepEqual(originalCirclePlan(memory,0,100,100,16,1,[0,320,0,200]),originalCirclePlan(memory,0,100,100,16,1,[0,320,0,200],undefined,'ms-1990'));
assert.deepEqual(originalCirclePlan(memory,0,100,100,16,1,[0,320,0,200],undefined,'ms-1991'),{type:'ellipse',points:[[100,100],[100,106],[108,100]],color:1});
assert.deepEqual(memory,before);
const seed=new Uint8Array(0x100000),sv=new DataView(seed.buffer),d=0x20000,c=0x10000;
sv.setUint16(d+0x3bc8,1,true);
for(const [offset,value]of [[0x5dae,0],[0x5db0,320],[0x5da4,0],[0x5da6,200],[0x5d96,0x9000],[0x5d9e,0x6000]])sv.setUint16(c+offset,value,true);
for(let y=0;y<200;y++)sv.setUint16(c+0x6000+y*2,y*320,true);
const outputs=[];
for(const physicsEngine of [undefined,'ms-1990','ms-1991']as const){
 const pixels=seed.slice();rasterOriginalDrawCall(pixels,d,c,{address:0x24ea8,args:[100,100,16,7],physicsEngine});outputs.push(pixels.slice(0x90000,0x90000+64000));
 assert.deepEqual(pixels.slice(0,0x90000),seed.slice(0,0x90000));
}
assert.deepEqual(outputs[0],outputs[1]);assert.notDeepEqual(outputs[1],outputs[2]);
console.log(JSON.stringify({diameters:65536,engineCases:196608,legacyDefaultPreserved:true,modernPlanRouted:true,sourceUnchanged:true}));
