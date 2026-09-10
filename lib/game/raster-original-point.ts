/** Original clipped pixel write, 2795A..279A8. CS owns the framebuffer segment,
 * row-offset table and exclusive clipping rectangle. Retains 16-bit address wrap.
 */
export function rasterOriginalPoint(memory:Uint8Array,cs:number,x:number,y:number,color:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(offset:number)=>v.getUint16((cs+(offset&65535))&0xfffff,true),signed=(n:number)=>(n<<16)>>16;
 x=signed(x);y=signed(y);
 if(x<signed(word(0x5da0))||x>=signed(word(0x5da2))||y<signed(word(0x5da4))||y>=signed(word(0x5da6)))return;
 const row=word(word(0x5d9e)+y*2),offset=(x+row)&65535;
 memory[(word(0x5d96)*16+offset)&0xfffff]=color&255;
}
