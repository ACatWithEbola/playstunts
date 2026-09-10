/** SETUP07EC..08CB calls1BC0 in this order; file/string order differs. */
export function initializeOriginalSetupMenus(memory:Uint8Array){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true),put=(at:number,value:number)=>v.setUint16(at&65535,value&65535,true);
 for(const [descriptor,entries] of [[0x20c,[0x266,0x242,0x254,0x230,0x21e]],[0x278,[0x2e4,0x28a,0x29c,0x2ae,0x2c0,0x2d2]],[0x19a,[0x1b8,0x1d6,0x1e8,0x1fa]]] as const){
  for(const entry of entries){
   if(!word(descriptor))put(descriptor,entry);if(!word(descriptor+2))put(descriptor+2,entry);
   put(entry+14,word(descriptor));put(entry+16,word(descriptor+2));put(word(entry+14)+16,entry);put(word(descriptor+2)+14,entry);put(descriptor+2,entry);put(descriptor+8,word(descriptor+8)+1);
  }
 }
 put(0x1c2,0x20c);put(0x1e0,0x278);
}
