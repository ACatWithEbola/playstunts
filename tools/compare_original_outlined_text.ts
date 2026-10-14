import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalOutlinedFontDisplay} from '../lib/game/font-outline-display.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,64);
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);v.setUint16(0x4dd2,0x7000,true);
 const events:unknown[]=[];
 drawOriginalOutlinedFontDisplay(memory,0,'ega',{text(offset,x,y,opaque){assert.equal(opaque,false);events.push({x:x&65535,y:y&65535,foreground:v.getUint16(0x70000,true),background:v.getUint16(0x70002,true)});}},row.text,row.x,row.y,15,0,0x5000);
 assert.deepEqual(events,row.events,JSON.stringify(row));
}
console.log(JSON.stringify({originalComparedOutlinedTextCases:rows.length,bothVersionsFivePassPositionsAndColoursMatch:true,pass:true}));
