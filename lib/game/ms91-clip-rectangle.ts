/** Original MS91 18a14..18a98. Near pointers wrap within DS; comparisons are
 * signed words. Preserve sequential reads/writes, including aliased records.
 * Returns true when rejected, without modifying the rectangle. */
export function clipMs91Rectangle(memory:Uint8Array,d:number,rectangle:number,clip:number){
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)throw Error('Original data segment is outside memory');
 for(const pointer of [rectangle,clip])if(!Number.isInteger(pointer)||pointer<0||pointer>65535)throw Error('Invalid near rectangle pointer');
 const read=(p:number)=>{const value=memory[d+(p&65535)]|memory[d+((p+1)&65535)]<<8;return value<<16>>16;};
 const write=(p:number,value:number)=>{memory[d+(p&65535)]=value&255;memory[d+((p+1)&65535)]=(value>>8)&255;};
 if(read(rectangle+2)<read(rectangle)||read(clip+2)<=read(rectangle)||read(rectangle+2)<=read(clip)||read(rectangle+4)>=read(clip+6)||read(rectangle+6)<=read(clip+4))return true;
 write(rectangle,Math.max(read(rectangle),read(clip)));
 write(rectangle+2,Math.min(read(rectangle+2),read(clip+2)));
 write(rectangle+4,Math.max(read(rectangle+4),read(clip+4)));
 write(rectangle+6,Math.min(read(rectangle+6),read(clip+6)));
 return false;
}
