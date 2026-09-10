import {drawOriginalPackedDisplayPoint} from './indexed-display-point.ts';
import {prepareOriginalLine} from './prepare-original-line.ts';
import {rasterCockpitLine} from './cockpit-line-raster.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original21D98 through CGA2575E or TDY2569C. Colour is a packed
 * byte pattern, not a logical two/four-bit point colour. */
export function drawOriginalPackedDisplayLine(memory:Uint8Array,d:number,mode:'cga'|'tandy',x0:number,y0:number,x1:number,y1:number,colour:number,before=new Uint8Array(28)){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),initial=before.slice();new DataView(initial.buffer,initial.byteOffset,initial.byteLength).setUint16(16,u(colour),true);
 const prepared=prepareOriginalLine(x0,y0,x1,y1,[cw(block+24),cw(block+26),cw(block+14),cw(block+16)],initial),v=new DataView(prepared.record.buffer,prepared.record.byteOffset,prepared.record.byteLength);
 if(prepared.result||v.getInt16(14,true)<=0)return prepared;
 const shift=mode==='cga'?2:1,units=1<<shift,maskBase=mode==='cga'?0x520a:0x532c,dest=cw(block)*16,pattern=prepared.record[16],write=(at:number,mask:number)=>{const address=(dest+u(at))&0xfffff;memory[address]=(memory[address]&(~mask&255))|(pattern&mask);};
 const kind=v.getUint16(18,true);
 if(kind===9){drawOriginalPackedDisplayPoint(memory,d,mode,v.getInt16(2,true),v.getInt16(6,true),colour);return prepared;}
 if(kind<=1){
  const x=(v.getInt32(0,true)+32768)>>16,y=(v.getInt32(4,true)+32768)>>16,index=x&(units-1),first=memory[d+maskBase+index];let target=u(cw(cw(block+8)+y*2)+(u(x)>>>shift));
  const remaining=s(v.getUint16(14,true)-memory[d+maskBase+units+index]);
  if(remaining<0)write(target,first&memory[d+maskBase+units*2+u(remaining+4)]);
  else {write(target,first);target=u(target+1);for(let n=0;n<(remaining>>>shift);n++){write(target,255);target=u(target+1);}write(target,memory[d+maskBase+units*2+(remaining&(units-1))]);}
 }else for(const [x,y] of rasterCockpitLine(prepared.record)){
  const mask=memory[d+maskBase+units*3+(x&(units-1))],target=u(cw(cw(block+8)+y*2)+(u(x)>>>shift));write(target,mask);
 }
 return prepared;
}
