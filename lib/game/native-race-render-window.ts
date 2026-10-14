/** Resolve the allocated legacy-layout race window through its descriptor,
 * rather than treating that descriptor as a bitmap or using MS91 addresses. */
export function nativeRaceRenderWindow(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 if(d<0||d+65536>memory.length)throw Error('Race data segment is outside memory');
 if(memory[d+0xaa46+high])throw Error('Page flipping owns its render window');
 const window={offset:v.getUint16(d+0x933a+high,true),segment:v.getUint16(d+0x933c+high,true)},base=window.segment*16+window.offset;
 if(base+30>memory.length)throw Error('Race render window descriptor is outside memory');
 const bitmapSegment=v.getUint16(base+2,true);
 if(!bitmapSegment||bitmapSegment*16+16>memory.length)throw Error('Race render bitmap is missing');
 return {window,bitmap:{offset:0,segment:bitmapSegment}};
}
