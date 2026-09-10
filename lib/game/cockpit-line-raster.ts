/** Original 0x251f4 raster stage, consuming its 28-byte prepared line record.
 * Clipping and endpoint preparation precede this stage in the original.
 */
export function rasterCockpitLine(record:Uint8Array){
 const v=new DataView(record.buffer,record.byteOffset,record.byteLength);
 let x=(v.getInt32(0,true)+32768)|0,y=(v.getInt32(4,true)+32768)|0;
 const step=v.getUint16(12,true),count=v.getUint16(14,true),kind=v.getUint16(18,true),pixels:number[][]=[];
 if(kind>9)throw Error('Invalid original prepared line kind');
 if(kind>=2&&kind<=6)y=v.getInt16(6,true)*65536;
 for(let i=0;i<(kind===9?1:count);i++){
  pixels.push([x>>16,y>>16,record[16]]);
  if(kind<=1)x+=65536;
  else if(kind===2)y+=65536;
  else if(kind===3){x-=65536;y+=65536;}
  else if(kind===4){x+=65536;y+=65536;}
  else if(kind===5){x-=step;y+=65536;}
  else if(kind===6){x+=step;y+=65536;}
  else if(kind===7){x-=65536;y+=step;}
  else if(kind===8){x+=65536;y+=step;}
 }
 return pixels;
}
