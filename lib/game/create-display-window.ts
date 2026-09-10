const u=(n:number)=>n&65535;
/** Original display window allocation arithmetic. EGA stores only selected
 * planes and rounds each plane to a paragraph before calculating total pages. */
export function originalDisplayWindowAllocation(mode:'cga'|'tandy'|'ega',width:number,height:number,planeMask=15){
 const bytes=(width&65535)>>(mode==='cga'?2:mode==='tandy'?1:3),size=u(bytes*(height&65535)),padding=mode==='ega'?(-size)&15:0,planeBytes=u(size+padding);
 const planes=mode==='ega'?Array.from({length:4},(_,i)=>(planeMask>>i)&1).reduce((a,b)=>a+b,0):1;
 return {bytes,padding,planeBytes,pages:mode==='ega'?u(((planeBytes*planes+16)>>>4)+1):u((u(size+16)>>>4)+1),nameOffset:mode==='cga'?0x5792:mode==='tandy'?0x58da:0x56a4};
}
/** Original window definition after backing allocation. Writes before a table
 * exhaustion error remain visible; descriptor words not set by the source survive. */
export function createOriginalDisplayWindow(memory:Uint8Array,mode:'cga'|'tandy'|'ega',width:number,height:number,bitmapSegment:number,planeMask=15){
 width=u(width);height=u(height);bitmapSegment=u(bitmapSegment);
 const c=0x209e0,top=mode==='cga'?0x70c8:mode==='tandy'?0x6ad6:0x9a40,limit=mode==='cga'?0x7eda:mode==='tandy'?0x78e8:0xa852,allocation=originalDisplayWindowAllocation(mode,width,height,planeMask),bitmap=bitmapSegment*16,put=(base:number,at:number,value:number)=>{memory[(base+u(at))&0xfffff]=value&255;memory[(base+u(at)+1)&0xfffff]=(value>>>8)&255;},word=(base:number,at:number)=>memory[(base+u(at))&0xfffff]|(memory[(base+u(at)+1)&0xfffff]<<8);
 for(const [at,value] of [[0,allocation.bytes],[2,height],[4,0],[6,0],[8,0],[10,0]])put(bitmap,at,value);
 if(mode==='ega'){memory.fill(0,bitmap+12,bitmap+16);let at=bitmap+12;for(let plane=0;plane<4;plane++)if(planeMask&(1<<plane))memory[at++]=1<<plane;memory[bitmap+15]|=allocation.padding<<4;}
 const offset=word(c,top),next=u(offset+u((height+15)*2));
 if(next>=limit)return {error:'window-table' as const,...allocation,offset,segment:0x209e};
 put(c,top,next);put(c,offset,0);
 if(mode==='ega'){let segment=bitmapSegment;for(let plane=0;plane<4;plane++){put(c,offset+2+plane*2,planeMask&(1<<plane)?segment:0);if(planeMask&(1<<plane))segment=u(segment+(allocation.planeBytes>>>4));}put(c,offset+22,allocation.padding);}
 else put(c,offset+2,bitmapSegment);
 for(const [field,value] of [[10,offset+30],[12,0],[26,0],[14,allocation.bytes],[20,allocation.bytes],[16,0],[18,height],[24,width],[28,width]])put(c,offset+field,value);
 for(let row=0;row<(height||65536);row++)put(c,offset+30+row*2,16+row*allocation.bytes);
 return {error:null,...allocation,offset,segment:0x209e};
}
