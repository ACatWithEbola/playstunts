import assert from 'node:assert/strict';
import {drawOriginalSceneBackgroundDisplay} from '../lib/game/scene-background-display.ts';
import {BACKGROUND_DISPLAY_LAYOUTS} from '../lib/game/background-display-layout.ts';
import {rotateZ,type Matrix} from '../lib/physics/rotation.ts';
import type {Ms91Rectangle} from '../lib/game/ms91-rectangle-list.ts';
for(const mode of ['cga','tandy','ega'] as const){
 const memory=new Uint8Array(0x100000),d=0x20000,v=new DataView(memory.buffer),a=BACKGROUND_DISPLAY_LAYOUTS[mode];memory[d+0x134]=2;
 for(const [at,word] of [[0x4b88,160],[0x4b8a,100],[0x4b8c,100],[0x4b8e,100],[a(0x7fe4),15],[a(0x9ae2),40]])v.setUint16(d+at,word,true);
 const regions:number[][]=[],host={bounds(){},clearWindow(){},bitmap(){},polygon(){},retainMs91SkyRegion(rectangle:number[]){regions.push(rectangle);}},matrix=[16384,0,0,0,16384,0,0,0,16384] as Matrix;
 assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,host,[0,320,0,120],1,matrix,0,0,0,{leftOffset:0,rightOffset:0}),0);assert.deepEqual(regions,[[0,320,60,100]]);
 regions.length=0;let draws=0,selected=0;
 const skipHost={...host,bounds(){draws++;},clearWindow(){draws++;},bitmap(){draws++;},polygon(){draws++;},ms91SkyRepaintRegions(){selected++;return [];}};
 assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,skipHost,[0,320,0,120],1,matrix,0,0,0,{leftOffset:0,rightOffset:0}),0);assert.equal(selected,1);assert.equal(draws,0,'Empty region list must not issue background drawing calls');assert.deepEqual(regions,[[0,320,60,100]]);
 regions.length=0;assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,host,[0,320,0,120],-1,matrix,0,0,0,{leftOffset:0,rightOffset:0}),1);assert.deepEqual(regions,[[0,320,0,120]]);
 v.setUint16(d+0x4b8c,200,true);v.setUint16(d+a(0x9ae8),65535,true);
 regions.length=0;assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,host,[0,320,0,200],1,rotateZ(8),8,0,0,{leftOffset:0,rightOffset:0}),0,'Shallow roll must exercise banked panorama');
 assert.equal(regions.length,1);assert.equal(regions[0][0],0);assert.equal(regions[0][1],320);assert.ok(regions[0][2]>0&&regions[0][3]<200,'Rolled bounds must be narrower than the full viewport');
 regions.length=0;assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,{...host,ms91FullRedraw:true},[0,320,0,200],1,rotateZ(8),8,0,0,{leftOffset:0,rightOffset:0}),0);assert.deepEqual(regions,[[0,320,0,200]]);
 v.setUint16(d+a(0x9be2),1,true);v.setUint16(d+a(0x909e),2,true);const events:string[]=[];let rolledPlans=0;
 const clearHost={...host,bounds(...bounds:number[]){events.push('bounds:'+bounds.join(','));},clearWindow(color:number){events.push('clear:'+color);},bitmap(){events.push('bitmap');},ms91RolledRepaintPlan(){rolledPlans++;return {clearSky:[[10,20,1,2] as Ms91Rectangle],clearGround:[[30,40,180,190] as Ms91Rectangle],panorama:null};}};
 assert.equal(drawOriginalSceneBackgroundDisplay(memory,d,mode,clearHost,[0,320,0,200],1,rotateZ(8),8,0,0,{leftOffset:0,rightOffset:0}),0);assert.equal(rolledPlans,1);assert.deepEqual(events,['bounds:10,20,1,2','clear:1','bounds:30,40,180,190','clear:2'],'Rolled driver clears must preserve color/order and skip a null panorama');
}
console.log('CGA/Tandy/EGA background producers cover forward, actual shallow-roll, rolled full-redraw and fallback callbacks');
