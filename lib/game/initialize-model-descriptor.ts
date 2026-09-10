/** Original1B894 shape descriptor initialization. Source reads remain
 * live when the destination overlaps the header; byte9 is retained. Far
 * offsets wrap without carrying into their segment. */
export function initializeOriginalModelDescriptor(memory:Uint8Array,d:number,source:{offset:number;segment:number},descriptor:number){
 const u=(n:number)=>n&65535,read=(offset:number)=>memory[((source.segment&65535)*16+u(source.offset+offset))&0xfffff],word=(offset:number)=>memory[d+u(descriptor+offset)]|(memory[d+u(descriptor+offset+1)]<<8),put=(offset:number,value:number)=>{memory[d+u(descriptor+offset)]=value&255;memory[d+u(descriptor+offset+1)]=(value>>>8)&255;};
 put(0,read(0));put(6,read(1));memory[d+u(descriptor+8)]=read(2);
 put(2,source.offset+4);put(4,source.segment);
 put(14,source.offset+word(0)*6+4);put(16,source.segment);
 put(18,source.offset+word(6)*4+word(0)*6+4);put(20,source.segment);
 put(10,source.offset+word(6)*8+word(0)*6+4);put(12,source.segment);
}
