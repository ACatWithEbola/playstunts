export interface OriginalEgaCaptureHost {writePort(port:number,value:number):void;readByte(offset:number):number}
/** Original EGA29840/29864 screen capture, including per-plane masks/padding.
 * Hardware reads require the selected-plane host. Software planes read live RAM. */
export function captureOriginalEgaDisplay(memory:Uint8Array,offset:number,segment:number,position?:{x:number;y:number},hardware?:OriginalEgaCaptureHost){
 const c=0x209e0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at,true);
 offset&=65535;segment&=65535;const address=(at:number)=>(segment*16+(at&65535))&0xfffff;
 const header=address(offset);
 if(position){v.setUint16(header+8,position.x&65535,true);v.setUint16(header+10,position.y&65535,true);}
 const x=word(header+8)<<16>>16,y=word(header+10),width=word(header),height=word(header+2),stride=word(c+0x9126),table=word(c+0x911c),twiceY=(y*2)&65535;
 const row=(y&32768)?((twiceY<<16>>17)*stride+word(c+table))&65535:word(c+((table+twiceY)&65535));
 const sourceStart=(row+(x>>3))&65535,padding=memory[header+15]>>>4,isHardware=word(c+0x9114)===0xa000;
 if(isHardware&&!hardware)throw Error('EGA screen capture requires a selected-plane video host');
 let destination=(offset+16)&65535;
 for(let part=0;part<4;part++){
  const mask=memory[address(offset+12+part)]&15;
  if(mask){
   const plane=memory[c+0x8e2c+mask],sourceSegment=word(c+0x9114+plane*2);
   if(isHardware||sourceSegment){
    if(isHardware){hardware!.writePort(0x3ce,4);hardware!.writePort(0x3cf,plane);}
    let source=sourceStart;
    for(let row=0;row<Math.max(1,height<<16>>16);row++){
     for(let column=0;column<width;column++){
      memory[address(destination)]=isHardware?hardware!.readByte(source)&255:memory[(sourceSegment*16+source)&0xfffff];
      destination=(destination+1)&65535;source=(source+1)&65535;
     }
     source=(source+stride-width)&65535;
    }
   }
  }
  destination=(destination+padding)&65535;
 }
}
