import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalMenuButtonDisplay} from '../lib/game/menu-button-display.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,80);
const word=(n:number)=>n&65535,sort=(values:unknown[])=>values.map(v=>JSON.stringify(v)).sort();
for(const row of rows){
 const memory=new Uint8Array(0x100000),d=0x60000,v=new DataView(memory.buffer);v.setUint16(d+0x4dd2,0x5000,true);v.setUint16(0x50000+16,6,true);
 for(let code=1;code<256;code++)v.setUint16(0x50000+22+code*2,600,true);
 const lines:number[][]=[],texts:unknown[]=[];let fill:number[]|undefined;
 drawOriginalMenuButtonDisplay(memory,d,{rectangle(x,y,width,height,color,clipped){
  if(clipped===false){fill=[x,y,width,height,color].map(word);return;}
  lines.push([x,y,x+width-1,y+height-1,color].map(word));
 },text(at,x,y){let end=at;while(memory[d+end])end++;texts.push([Buffer.from(memory.slice(d+at,d+end)).toString(),word(x),word(y)]);}},Array.from(Buffer.from(row.text)),row.coordinate,row.coordinate,row.extent,row.extent,15,1,0,15,0x2000);
 assert.deepEqual(fill,row.events.find((e:any)=>e[0]==='rectangle')[1]);
 // Same-color border lines commute; native interleaves horizontal/vertical calls.
 assert.deepEqual(sort(lines),sort(row.events.filter((e:any)=>e[0]==='line').map((e:any)=>e[1])));
 assert.deepEqual(texts,row.events.filter((e:any)=>e[0]==='text').map((e:any)=>e[1]),`text ${row.text} coordinate ${row.coordinate} extent ${row.extent}`);
}
console.log('PASS: 80 native labelled-button geometries and text positions match both original captures');
