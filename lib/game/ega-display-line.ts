import {prepareOriginalLine} from './prepare-original-line.ts';
import {rasterCockpitLine} from './cockpit-line-raster.ts';
import {fillOriginalEgaDisplayRectangle} from './ega-display-fill.ts';
import {drawOriginalEgaPoint} from './indexed-display-point.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535;
/** Original21D98/25DF8 EGA lines, including hardware setup before the
 * horizontal/point dispatch and the missing-plane diagonal branch quirk. */
export function* drawOriginalEgaDisplayLine(memory:Uint8Array,d:number,x0:number,y0:number,x1:number,y1:number,colour:number,before=new Uint8Array(28)):Generator<OriginalEgaBitmapOperation,{record:Uint8Array;result:number},number>{
 const c=0x209e0,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),initial=before.slice();new DataView(initial.buffer,initial.byteOffset,initial.byteLength).setUint16(16,u(colour),true);
 const prepared=prepareOriginalLine(x0,y0,x1,y1,[cw(0x912c),cw(0x912e),cw(0x9122),cw(0x9124)],initial),v=new DataView(prepared.record.buffer,prepared.record.byteOffset,prepared.record.byteLength);
 if(prepared.result||v.getInt16(14,true)<=0)return prepared;
 const hardware=cw(0x9114)===0xa000,kind=v.getUint16(18,true),stride=cw(0x9126);
 if(hardware){yield {kind:'port-word',port:0x3c4,value:0xf02};yield {kind:'port-word',port:0x3ce,value:0x205};}
 if(kind<=1){yield* fillOriginalEgaDisplayRectangle(memory,d,v.getInt16(2,true),v.getInt16(6,true),v.getUint16(14,true),1,colour,false);return prepared;}
 if(kind===9){yield* drawOriginalEgaPoint(memory,d,v.getInt16(2,true),v.getInt16(6,true),colour);return prepared;}
 const rasterRecord=prepared.record.slice();if(!hardware&&kind===4&&[0,1,2,3].some(plane=>!cw(0x9114+plane*2)))rasterRecord[18]=3;
 const pixels=rasterCockpitLine(rasterRecord),startY=hardware?(v.getInt32(4,true)+32768)>>16:v.getInt16(6,true),startRow=cw(cw(0x911c)+startY*2);
 if(hardware&&kind===2)yield {kind:'port-word',port:0x3ce,value:(memory[d+0x531a+(pixels[0][0]&7)]<<8)|8};
 for(const [x,y] of pixels){
  const mask=memory[d+0x531a+(x&7)],row=hardware||kind===2?u(startRow+(y-startY)*stride):cw(cw(0x911c)+y*2),target=u(row+(u(x)>>>3));
  if(hardware){if(kind!==2)yield {kind:'port-word',port:0x3ce,value:(mask<<8)|8};yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:colour&255};}
  else for(let plane=3;plane>=0;plane--){const segment=cw(0x9114+plane*2);if(!segment)continue;const address=(segment*16+target)&0xfffff;memory[address]=(memory[address]&(~mask&255))|(colour&(1<<plane)?mask:0);}
 }
 if(hardware){yield {kind:'port-word',port:0x3ce,value:5};yield {kind:'port-word',port:0x3ce,value:0xff08};}
 return prepared;
}
