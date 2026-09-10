/** SuppliedF3AE..F4BF panorama resource setup. PVS conversion is retained in
 * the extracted resources; the palette and landscape art remain unchanged. */
export function installOriginalMenuPanorama(memory:Uint8Array,d:number,landscape:number,images:Record<string,ReadonlyArray<number>>){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getUint16(d+o,true),set=(o:number,n:number)=>v.setUint16(d+o,n,true);
 if(!(landscape&8)&&memory[d+0x130]&&memory[d+0xa777]===(landscape&255))return;
 if(!(landscape&8)){
  let address=0xb0000;const heights:number[]=[];
  for(const [i,name]of ['scen','sce2','sce3','sce4'].entries()){
   const bytes=images[name];if(!bytes)throw Error('Missing original panorama '+name);
   if(address+bytes.length>memory.length)throw Error('Original panorama exceeds retained memory');
   memory.set(bytes,address);set(0xa390+i*4,address&15);set(0xa392+i*4,address>>>4);const height=bytes[2]|bytes[3]<<8;heights.push(height);set(0x9b2c+i*2,height);address=(address+bytes.length+15)&~15;
  }
  set(0x7fe4,Math.min(...heights));set(0x9ae2,Math.max(...heights));memory[d+0x130]=1;memory[d+0xa777]=landscape&255;
 }
 const colors=word(0x51ca);set(0x9be2,word(colors+0x22));set(0x909e,word(colors+0x20));set(0xa9f2,word(colors+0xc8));set(0x9372,word(0x4e8a));
}
