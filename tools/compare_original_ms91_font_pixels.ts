import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalEgaDisplayFont} from '../lib/game/ega-display-font.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,(rows[0].opaque?144:48)*(rows[0].proportional?(rows[0].positiveWidthOnly?5:6):1));
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),c=0x209e0,d=0x60000;
 memory.set(Buffer.from(row.font,'hex'),0x70000);v.setUint16(d+0x4dd2,0x7000,true);memory.set(Buffer.from(row.text+'\0'),d+0x5000);
 for(const [n,segment]of [0x9000,0x9200,0x9400,0x9600].entries()){v.setUint16(c+0x9114+n*2,segment,true);memory.fill(0xa5,segment*16,segment*16+256);}
 v.setUint16(c+0x911c,0xb000,true);v.setUint16(c+0x9126,8,true);for(let n=0;n<32;n++)v.setUint16(c+0xb000+n*2,n*8,true);
 const flow=drawOriginalEgaDisplayFont(memory,d,0x5000,row.x,2,row.opaque??false);let step=flow.next();while(!step.done){assert.equal(step.value.kind,'port-word');step=flow.next(0);}
 for(const [n,segment]of [0x9000,0x9200,0x9400,0x9600].entries())assert.equal(Buffer.from(memory.subarray(segment*16,segment*16+256)).toString('hex'),row.planes[n],JSON.stringify({height:row.height,x:row.x,foreground:row.foreground,text:row.text,plane:n}));
 assert.deepEqual([v.getUint16(0x70008,true),v.getUint16(0x7000a,true)],row.cursor);
}
console.log(JSON.stringify({originalPixelCases:rows.length,allFourSoftwarePlanesAndCursorMatch:true,pass:true}));
