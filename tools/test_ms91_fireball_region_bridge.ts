import assert from 'node:assert/strict';
import {drawOriginalCrashFireballs} from '../lib/game/crash-fireballs.ts';
for(const mode of ['mcga','cga','tandy','ega'] as const){
 const memory=new Uint8Array(0x100000),d=0x20000,high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],v=new DataView(memory.buffer),local=0xee94;
 const put=(at:number,n:number)=>v.setInt16(d+at,n,true);
 [320,0,200,0].forEach((n,i)=>put(0x9032+high+i*2,n));
 [20,80,30,70].forEach((n,i)=>put(local+i*2,n));put(0x9c48+high,128);
 const before=memory.slice(),calls:unknown[]=[];
 drawOriginalCrashFireballs(memory,d,[0,60,0,50],{player:1,opponent:0},mode,{bounds(...r){calls.push(r);},scaledSprite(pointer,scale,position){calls.push({pointer,scale,position});}},undefined,[local,0xee70]);
 assert.deepEqual(calls,[[20,60,30,50],{pointer:{offset:0,segment:0},scale:80,position:{x:40,y:40}}]);
 [20,60,30,50].forEach((n,i)=>new DataView(before.buffer).setInt16(d+local+i*2,n,true));
 assert.deepEqual(memory,before,'Only selected local rectangle may be clipped');
}
console.log('MS91 fast-video fireballs consume explicitly mapped local bounds in all four display layouts without touching retained car regions');
