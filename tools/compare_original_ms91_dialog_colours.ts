import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalDialogDisplay} from '../lib/game/dialog-display.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,32);
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),font=0x10000;
 v.setUint16(0x4dd2,0x1000,true);v.setUint16(font+14,8,true);v.setUint16(font+16,1,true);
 for(let c=1;c<128;c++)v.setUint16(font+22+c*2,1,true);
 const text=Array.from('Title]'+Array.from({length:row.count},(_,n)=>'['+String.fromCharCode(65+n)+']').join('')+'\0',c=>c.charCodeAt(0));
 const colours:number[][]=[];
 drawOriginalDialogDisplay(memory,0,'ega',{bounds(){},clearWindow(){},rectangle(){},text(offset){
  if(memory[offset]>=65&&memory[offset]<65+row.count&&memory[offset+1]===0)colours.push([v.getUint16(font,true),v.getUint16(font+2,true)]);
 }},text,row.selected,{text:15,border:4,disabled:1},0xe800,row.disabled,2,{x:-1,y:-1},'ms-1991');
 assert.deepEqual(colours,row.colours,JSON.stringify(row));
}
console.log(JSON.stringify({originalComparedColourCases:rows.length,selectedInversionAndDisabledColoursMatch:true,pass:true}));
