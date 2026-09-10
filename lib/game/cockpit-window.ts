const CS=0x209e0,NEXT=CS+0x6138,LIMIT=0x6f4a;
/** Original 26a40 window definition after allocation. The allocator must supply
 * the actual bitmap segment. Retained descriptor words and unused rows survive.
 */
export function createCockpitWindow(before:Uint8Array,width:number,height:number,bitmapSegment:number){
 const memory=before.slice(),view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(at:number,value:number)=>view.setUint16(at,value&65535,true);
 width&=65535;height&=65535;bitmapSegment&=65535;
 const pages=((((width*height+16)&65535)>>>4)+1)&65535;
 const bitmap=bitmapSegment*16;
 for(const [offset,value] of [[0,width],[2,height],[4,0],[6,0],[8,0],[10,0]])word(bitmap+offset,value);
 const offset=view.getUint16(NEXT,true),next=(offset+((height+15)*2&65535))&65535;
 if(next>=LIMIT)throw Error('Original window definition row table exhausted');
 word(NEXT,next);
 for(const [field,value] of [[0,0],[2,bitmapSegment],[10,offset+30],[12,0],[26,0],[14,width],[20,width],[16,0],[18,height],[24,width],[28,width]])word(CS+offset+field,value);
 // LOOP treats zero as 65536 iterations; normal cockpit resources have nonzero height.
 for(let y=0;y<(height||65536);y++)word(CS+((offset+30+y*2)&65535),16+y*width);
 return {memory,pages,offset,segment:0x209e};
}
