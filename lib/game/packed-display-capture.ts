/** Original CGA27036/2705A and TDY26BB2/26BD6 screen capture.
 * Descriptor width is bytes. No clipping is applied; stored coordinates,
 * negative x, source/destination offset wrapping and forward overlap survive. */
export function captureOriginalPackedDisplay(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number}){
 const c=0x209e0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true),base=mode==='cga'?0x6864:0x63d4;
 offset&=65535;segment&=65535;const descriptor=segment*16+offset;
 const put=(at:number,value:number)=>v.setUint16(descriptor+at,value&65535,true);
 if(position){put(8,position.x);put(10,position.y);}
 const x=word(descriptor+8)<<16>>16,y=word(descriptor+10),width=word(descriptor),sourceSegment=word(c+base);
 const rows=Math.max(1,word(descriptor+2)<<16>>16);
 let table=(word(c+base+8)+y*2)&65535,destination=(offset+16)&65535;
 for(let row=0;row<rows;row++){
  let source=(word(c+table)+(x>>(mode==='cga'?2:1)))&65535;
  for(let column=0;column<width;column++){
   memory[(segment*16+destination)&0xfffff]=memory[(sourceSegment*16+source)&0xfffff];
   destination=(destination+1)&65535;source=(source+1)&65535;
  }
  table=(table+2)&65535;
 }
}
