import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalDialogLayout} from '../lib/game/dialog-layout.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {drawOriginalDialogDisplay} from '../lib/game/dialog-display.ts';
import {measureOriginalFont} from '../lib/game/font-raster.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
const suppliedFont=process.argv[3]?new Uint8Array(readFileSync(process.argv[3])):undefined;
const measure=(line:ReadonlyArray<number>)=>suppliedFont?measureOriginalFont(suppliedFont,line):line.length;
assert.ok(rows.length===96||rows.length===132,'Expected complete standard or larger-menu corpus');
for(const row of rows){
 const bytes=Array.from(row.text+'\0',(c:string)=>c.charCodeAt(0));
 if(row.content){
  const {layout,...content}=originalDialogContent(bytes,measure,row.position[0],row.position[1],3,'ms-1991',row.height);
  assert.deepEqual(content,row.content,JSON.stringify({height:row.height,text:row.text,position:row.position}));
  if(row.requests){
   const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),font=0x10000;
   if(suppliedFont)memory.set(suppliedFont,font);
   v.setUint16(0x4dd2,0x1000,true);v.setUint16(font+14,row.height,true);v.setUint16(font+16,1,true);
   if(!suppliedFont)for(let c=1;c<128;c++)v.setUint16(font+22+c*2,1,true);
   let bounds:number[]=[],clear=-1;const rectangles:number[][]=[];
   drawOriginalDialogDisplay(memory,0,'ega',{bounds(...n){bounds=n;},clearWindow(n){clear=n;},rectangle(...n){rectangles.push(n.slice(0,5) as number[]);},text(){}},
    bytes,0,{text:15,border:4,disabled:1},0xe800,undefined,3,{x:row.position[0],y:row.position[1]},'ms-1991');
   assert.deepEqual(bounds,row.requests.bounds);assert.equal(clear,row.requests.clear);
   const [left,top,right,bottom,colour]=row.requests.outline;
   assert.deepEqual(rectangles,[[left,top,right-left+1,1,colour],[left,bottom,right-left+1,1,colour],
    [left,top,1,bottom-top,colour],[right,top,1,bottom-top,colour]]);
   assert.deepEqual(row.requests.colours,[[15,0],[15,0]]);
  }
 }else{
  const {lineCount,...layout}=originalDialogLayout(bytes,measure,row.position[0],row.position[1],'ms-1991',row.height);
  assert.deepEqual(layout,row.layout,JSON.stringify({height:row.height,text:row.text,position:row.position}));
 }
}
console.log(JSON.stringify({originalComparedCases:rows.length,fontHeights:[6,8,10,12],
 scope:rows[0].content?'text lines, editable fields and choice hit areas':'outer bounds, dimensions and positioning',allComparedValuesMatch:true,pass:true}));
