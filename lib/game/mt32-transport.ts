export type OriginalMt32MpuOperation={kind:'read';port:number}|{kind:'write';port:number;value:number}|{kind:'interrupts';enabled:boolean}|{kind:'delay';loop:'decrement-dx';iterations:number};
export type OriginalMt32MpuProgram=Generator<OriginalMt32MpuOperation,number,number>;

/** MT15:0191. Its signed CX comparison exits after the first unsuccessful
 * readiness poll (FFFF decrements to FFFE). STI is unconditional, even if
 * the caller entered with interrupts disabled. */
export function* commandOriginalMt32Mpu(value:number):OriginalMt32MpuProgram{
 let result=0xffff;
 if(!((yield {kind:'read',port:0x331})&0x40)){
  yield {kind:'interrupts',enabled:false};
  yield {kind:'write',port:0x331,value:value&255};
  if(!((yield {kind:'read',port:0x331})&0x80)){
   if(((yield {kind:'read',port:0x330})&255)===0xfe)result=0;
  }
 }
 yield {kind:'interrupts',enabled:true};
 return result;
}

/** MT15:01D8 reports success but discards the byte it has just read. */
export function* readOriginalMt32Mpu():OriginalMt32MpuProgram{
 if((yield {kind:'read',port:0x331})&0x80)return 0xffff;
 yield {kind:'read',port:0x330};return 0;
}

/** MT15:01FD. The branch at020F restarts the loop before its timeout code.
 * Yielding each I/O operation lets a host model an indefinitely busy MPU
 * without blocking the browser or inventing a successful write. Incoming
 * data is drained only while output is busy. The40-byte queue has no full
 * check: its writer may wrap onto the reader and appear empty. */
export function* writeOriginalMt32Mpu(driver:Uint8Array,value:number):OriginalMt32MpuProgram{
 const view=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);
 for(;;){
  const status=(yield {kind:'read',port:0x331})&255;
  if(!(status&0x40)){yield {kind:'write',port:0x330,value:value&255};return 0;}
  if(!(status&0x80)){
   let position=view.getUint16(0x172,true);
   driver[(position+0x14a)&65535]=(yield {kind:'read',port:0x330})&255;
   position=(position+1)&65535;if(position===40)position=0;
   view.setUint16(0x172,position,true);
  }
 }
}

/** MT15:02C1 returns FFFF for empty, otherwise the next zero-extended byte. */
export function readOriginalMt32Queue(driver:Uint8Array){
 const view=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);
 let position=view.getUint16(0x174,true);
 if(position===view.getUint16(0x172,true))return 0xffff;
 const result=driver[(position+0x14a)&65535];
 position=(position+1)&65535;if(position===40)position=0;
 view.setUint16(0x174,position,true);return result;
}
