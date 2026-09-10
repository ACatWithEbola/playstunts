const signed=(value:number)=>value<<16>>16;
const cs=0x209e0;
/** Original CGA288EA / TDY282F8 packed point drawing. Horizontal clipping
 * compares byte columns, retaining the original coarse edge and colour spill. */
export function drawOriginalPackedDisplayPoint(memory:Uint8Array,d:number,mode:'cga'|'tandy',x:number,y:number,colour:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true);
 const base=mode==='cga'?0x6864:0x63d4,shift=mode==='cga'?2:1;
 x&=65535;y&=65535;
 const column=signed(x)>>shift;
 if(column<signed(word(cs+base+10))||column>=signed(word(cs+base+12))||signed(y)<signed(word(cs+base+14))||signed(y)>=signed(word(cs+base+16)))return;
 const pixel=x&((1<<shift)-1),row=(word(cs+base+8)+((y*2)&65535))&65535;
 const offset=((x>>>shift)+word(cs+row))&65535,address=(word(cs+base)*16+offset)&0xfffff;
 const masks=mode==='cga'?0x579e:0x58e2,shifts=mode==='cga'?0x57a2:0x58e4,count=memory[d+shifts+pixel]&31;
 memory[address]=((colour&255)<<count)&255 | (memory[address]&memory[d+masks+pixel]);
}
/** Original EGA2B272 software-plane branch. The A000 hardware branch needs
 * VGA latches and register I/O and is deliberately left to an explicit host. */
export function drawOriginalSoftwareEgaPoint(memory:Uint8Array,d:number,x:number,y:number,colour:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true);
 x&=65535;y&=65535;const column=signed(x)>>3;
 if(signed(y)<signed(word(cs+0x9122))||signed(y)>=signed(word(cs+0x9124))||column<signed(word(cs+0x911e))||column>=signed(word(cs+0x9120)))return;
 if(word(cs+0x9114)===0xa000)throw Error('EGA hardware point requires a planar video-memory host');
 const row=(word(cs+0x911c)+((y*2)&65535))&65535,offset=((x>>>3)+word(cs+row))&65535,mask=memory[d+0x56c2+(x&7)];
 for(let plane=0;plane<4;plane++){
  const segment=word(cs+0x9114+plane*2);if(!segment)continue;
  const address=(segment*16+offset)&0xfffff;
  memory[address]=colour&(1<<plane)?memory[address]|mask:memory[address]&(~mask&255);
 }
}
export type OriginalEgaPointOperation={kind:'port-word';port:number;value:number}|{kind:'read';offset:number}|{kind:'write';offset:number;value:number};
/** Original EGA point dispatch. For A000, the host owns the graphics latches
 * and register effects; the read is essential even though its value is unused. */
export function* drawOriginalEgaPoint(memory:Uint8Array,d:number,x:number,y:number,colour:number):Generator<OriginalEgaPointOperation,void,number>{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true);
 x&=65535;y&=65535;const column=signed(x)>>3;
 if(signed(y)<signed(word(cs+0x9122))||signed(y)>=signed(word(cs+0x9124))||column<signed(word(cs+0x911e))||column>=signed(word(cs+0x9120)))return;
 if(word(cs+0x9114)!==0xa000){drawOriginalSoftwareEgaPoint(memory,d,x,y,colour);return;}
 const row=(word(cs+0x911c)+((y*2)&65535))&65535,offset=((x>>>3)+word(cs+row))&65535;
 yield {kind:'port-word',port:0x3c4,value:0xff02};
 yield {kind:'port-word',port:0x3ce,value:(memory[d+0x56c2+(x&7)]<<8)|8};
 yield {kind:'port-word',port:0x3ce,value:0x0205};
 yield {kind:'read',offset};
 yield {kind:'write',offset,value:colour&255};
 yield {kind:'port-word',port:0x3ce,value:0xff08};
 yield {kind:'port-word',port:0x3ce,value:5};
}
