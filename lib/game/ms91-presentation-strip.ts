/** Original MS91144ab..144e3. Native MS91 addresses, not legacy-layout offsets.
 * Rectangle union stays caller-owned until its driver alignment is verified. */
export function prepareMs91PresentationStrip(memory:Uint8Array,d:number,bp:number,combine:(first:number,second:number,destination:number)=>void){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),u=(n:number)=>n&65535;
 const word=(at:number)=>v.getUint16(d+u(at),true),set=(at:number,value:number)=>v.setUint16(d+u(at),value,true);
 if(!word(0x9690))return;
 set(bp-10,0);set(bp-8,320);set(bp-6,word(0xaec6));set(bp-4,word(0xa1b6));
 const rectangle=word(0x9a);
 if(rectangle)combine(rectangle,u(bp-10),rectangle);
}
