/** Original18172 rectangle union, retaining sequential aliasing and horizontal
 * display alignment after combining all four signed coordinates. */
export function combineOriginalRectangles(m:Uint8Array,d:number,first:number,second:number,destination:number,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(at:number)=>v.getUint16(d+u(at),true),signed=(at:number)=>v.getInt16(d+u(at),true),set=(at:number,n:number)=>v.setUint16(d+u(at),u(n),true);
 for(const at of [0,2,4,6])set(destination+at,at===0||at===4?Math.min(signed(first+at),signed(second+at)):Math.max(signed(first+at),signed(second+at)));
 if(word(address(0x93da))!==1)set(destination+2,(word(destination+2)+word(address(0x93da))-1)&word(address(0x9ae8)));
}
