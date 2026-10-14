import assert from 'node:assert/strict';
import {originalDialogLayout} from '../lib/game/dialog-layout.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {createNativeDialogRuntime} from '../lib/game/native-dialog-runtime.ts';
import {measureOriginalFont} from '../lib/game/font-raster.ts';
import {createNativeDisplayDialogRuntime} from '../lib/game/native-display-dialog-runtime.ts';
const bytes=Array.from(new TextEncoder().encode('Title]}[A][B]}[C]\0'));
const measure=(line:ReadonlyArray<number>)=>line.length;
assert.deepEqual(originalDialogLayout(bytes,measure),originalDialogLayout(bytes,measure,-1,-1,'ms-1990'));
assert.deepEqual(originalDialogContent(bytes,measure),originalDialogContent(bytes,measure,-1,-1,2,'ms-1990'));
const modern=originalDialogContent(bytes,measure,-1,-1,2,'ms-1991');
assert.equal(modern.layout.contentHeight,48);
assert.deepEqual(modern.choices.map(choice=>choice.top-modern.layout.y),[15,25,38]);
assert.deepEqual(modern.choices.map(choice=>bytes.slice(choice.offset,choice.offset+choice.length)),[[65],[66],[67]]);
assert.ok(modern.lines.every(line=>!line.text.includes(125)));
assert.ok(modern.choices.every(choice=>choice.bottom<modern.layout.bounds[3]));
console.log('MS91 compact dialog spacing and choice labels pass; default/legacy layout unchanged');
const font=new Uint8Array(4096),v=new DataView(font.buffer),pixels=new Uint8Array(65536).fill(7);
v.setUint16(14,8,true);v.setUint16(18,8,true);font[20]=1;
for(let code=32;code<127;code++){const at=600+(code-32)*9;v.setUint16(22+code*2,at,true);font[at]=8;}
const expected=originalDialogContent(bytes,line=>measureOriginalFont(font,line),-1,-1,2,'ms-1991'),choice=expected.choices[2];
const bounds:(readonly number[]|null)[]=[];
const runtime=createNativeDialogRuntime({physicsEngine:'ms-1991',pixels,font,resources:{menu:bytes},present(){},presentDialog(value){bounds.push(value);},async input(){return {key:13,x:choice.left+1,y:choice.top+1,mouseActive:true,buttons:1};},async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path){return {path,key:27};}});
assert.equal(await runtime.dialog('menu',2),2,'Hit testing must use the modern rendered row');
assert.deepEqual(bounds[0],expected.layout.bounds);
assert.equal(bounds.at(-1),null);
assert.ok(pixels.every(pixel=>pixel===7),'Dialog dismissal restores the previous framebuffer');
console.log('Modern dialog runtime rendering/hit-test geometry agrees and restores its backdrop');
for(const mode of ['cga','tandy','ega'] as const){
 const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);memory.set(font,0x10000);view.setUint16(0x4dd2,0x1000,true);
 let restored=false;const displayBounds:number[][]=[],rectangles:number[][]=[];
 const displayRuntime=createNativeDisplayDialogRuntime({physicsEngine:'ms-1991',memory:()=>memory,d:0,mode,resources:{menu:bytes},drawing:{bounds(...values){displayBounds.push(values);},clearWindow(){},rectangle(...values){rectangles.push(values.slice(0,5) as number[]);},text(){}},capture(){return ()=>{restored=true;};},present(){},async input(){return {key:13,x:choice.left+1,y:choice.top+1,mouseActive:true,buttons:1};},async release(){},async gameCounter(){return 1;}},0xe800);
 assert.equal(await displayRuntime.dialog('menu',2),2,mode+' hit testing uses MS91 row spacing');
 assert.deepEqual(displayBounds[0],expected.layout.bounds);
 assert.equal(rectangles[1][1],expected.layout.y+expected.layout.contentHeight!+4,mode+' bottom border uses compact height');
 assert.ok(restored,mode+' backdrop restored');
}
console.log('CGA/Tandy/EGA modern dialog geometry, compact border and hit testing agree');
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const keys=[0x4800,13],target=new Uint8Array(65536).fill(7);
 const keyboardRuntime=createNativeDialogRuntime({physicsEngine,pixels:target,font,resources:{menu:bytes},present(){},
  async input(){return {key:keys.shift()??13,x:0,y:0,mouseActive:false,buttons:0};},
  async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path){return {path,key:27};}});
 assert.equal(await keyboardRuntime.dialog('menu',2,0),physicsEngine==='ms-1991'?2:0);
 assert.ok(target.every(pixel=>pixel===7));
 const startupRuntime=createNativeDialogRuntime({physicsEngine,pixels:target,font,resources:{menu:bytes},present(){},
  async input(){return {key:13,x:0,y:0,mouseActive:false,buttons:0};},
  async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path){return {path,key:27};}});
 assert.equal(await startupRuntime.dialog('menu',2,0,4,[1,0,0]),physicsEngine==='ms-1991'?1:0);
 assert.ok(target.every(pixel=>pixel===7));
}
console.log('Keyboard wrap engine routing passes through native dialog lifecycle; legacy clamps');
for(const height of [6,8,10,12]){
 v.setUint16(14,height,true);
 const content=originalDialogContent(bytes,line=>measureOriginalFont(font,line),-1,-1,2,'ms-1991',height),step=height+2;
 assert.equal(content.layout.contentHeight,step*4+8);
 assert.deepEqual(content.choices.map(c=>c.top-content.layout.y),[step+5,step*2+5,step*3+8]);
 assert.ok(content.choices.every(c=>c.bottom-c.top===step));
 assert.deepEqual(originalDialogContent(bytes,line=>line.length,-1,-1,2,'ms-1990',height),originalDialogContent(bytes,line=>line.length,-1,-1,2,'ms-1990',8));
 const choice=content.choices[2],target=new Uint8Array(65536).fill(7),bounds:(readonly number[]|null)[]=[];
 const dynamic=createNativeDialogRuntime({physicsEngine:'ms-1991',pixels:target,font,resources:{menu:bytes},present(){},presentDialog(value){bounds.push(value);},
  async input(){return {key:13,x:choice.left+1,y:choice.bottom-1,mouseActive:true,buttons:1};},async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path){return {path,key:27};}});
 assert.equal(await dynamic.dialog('menu',2),2);assert.deepEqual(bounds[0],content.layout.bounds);assert.ok(target.every(pixel=>pixel===7));
}
v.setUint16(14,8,true);
console.log('Modern font-derived row heights6/8/10/12 match layout, drawing and hit testing; legacy fixed spacing retained');
