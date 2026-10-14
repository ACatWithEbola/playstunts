import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalSoftwareEgaRawBitmap} from '../lib/game/ega-display-raw-bitmap.ts';
import {drawOriginalEgaPackedBitmap} from '../lib/game/ega-display-bitmap.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,(rows[0].clipped?81:36)*(rows[0].compressed?3:1));
for(const row of rows){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),c=0x209e0,bitmap=Buffer.from(row.bitmap,'hex');memory.set(bitmap,0x70000);
 for(const [n,segment]of [0x9000,0x9200,0x9400,0x9600].entries()){v.setUint16(c+0x9114+n*2,segment,true);memory.fill(0xa5,segment*16,segment*16+256);}
 for(const [at,value]of [[0x911c,0xb000],[0x9126,8],[0x911e,0],[0x9120,8],[0x9122,0],[0x9124,32]])v.setUint16(c+at,value,true);
 for(let n=0;n<32;n++)v.setUint16(c+0xb000+n*2,n*8,true);
 if(row.compressed){
  const flow=drawOriginalEgaPackedBitmap(memory,0x60000,0,0x7000,row.clipped?{x:row.x,y:row.y}:undefined,'copy',row.clipped??false);
  let step=flow.next();while(!step.done){throw Error('Unexpected hardware operation in software-plane case: '+step.value.kind);}
 }else drawOriginalSoftwareEgaRawBitmap(memory,0,0x7000,row.clipped?{x:row.x,y:row.y}:undefined,'copy',row.clipped??false);
 for(const [n,segment]of [0x9000,0x9200,0x9400,0x9600].entries())assert.equal(Buffer.from(memory.subarray(segment*16,segment*16+256)).toString('hex'),row.planes[n],JSON.stringify({width:row.width,height:row.height,x:row.x,plane:n}));
 assert.deepEqual(Buffer.from(memory.subarray(0x70000,0x70000+bitmap.length)),bitmap);
}
console.log(JSON.stringify({originalComparedRawBitmapCases:rows.length,allFourSoftwarePlaneBytesMatch:true,sourceBitmapsUnchanged:true,pass:true}));
