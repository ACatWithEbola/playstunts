import {writeOriginalMt32Mpu,commandOriginalMt32Mpu,type OriginalMt32MpuProgram} from './mt32-transport.ts';
import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';

export type OriginalMt32ByteReader=(segment:number,offset:number)=>number;
/** MT15:027C. Device/model/command bytes and the seven-bit checksum are
 * preserved. Each payload byte is followed by100 reads of port61, not an
 * invented duration in milliseconds. A zero16-bit count executes65536 times. */
export function* sendOriginalMt32SystemExclusive(driver:Uint8Array,readByte:OriginalMt32ByteReader,segment:number,offset:number,length:number):OriginalMt32MpuProgram{
 for(const byte of [0xf0,0x41,0x10,0x16,0x12])yield* writeOriginalMt32Mpu(driver,byte);
 let sum=0;
 for(let i=0;i<((length&65535)||65536);i++){
  const value=readByte(segment&65535,(offset+i)&65535)&255;sum=(sum+value)&65535;
  yield* writeOriginalMt32Mpu(driver,value);
  for(let delay=0;delay<100;delay++)yield {kind:'read',port:0x61};
 }
 yield* writeOriginalMt32Mpu(driver,(-sum)&127);
 yield* writeOriginalMt32Mpu(driver,0xf7);return 0;
}

/** MT15:02F6 uploads8-byte patch records and, for type2,246-byte custom
 * timbres. The supplied driver scratch fields retain the upload addresses. */
export function* uploadOriginalMt32Patches(driver:Uint8Array,readByte:OriginalMt32ByteReader,segment:number,offset:number):OriginalMt32MpuProgram{
 driver.fill(0,0x45,0x49);let position=offset&65535;
 const next=()=>{const value=readByte(segment&65535,position)&255;position=(position+1)&65535;return value;};
 driver[0x49]=next();
 while(driver[0x49]){
  driver.set([5,driver[0x45],driver[0x46]],0x4a);
  for(let i=0;i<8;i++)driver[0x4d+i]=next();
  const type=driver[0x4d];
  yield* sendOriginalMt32SystemExclusive(driver,(_segment,at)=>driver[at],0,0x4a,11);
  driver[0x46]+=8;if(driver[0x46]&128){driver[0x46]=0;driver[0x45]++;}
  if(type===2){
   driver.set([8,driver[0x47],driver[0x48]],0x4a);
   for(let i=0;i<246;i++)driver[0x4d+i]=next();
   yield* sendOriginalMt32SystemExclusive(driver,(_segment,at)=>driver[at],0,0x4a,249);
   driver[0x47]+=2;
  }
  for(let delay=0;delay<60000;delay++)yield {kind:'read',port:0x61};
  driver[0x49]--;
 }
 return 0;
}

/** MT15:03D0 resets MPU, enters UART mode, sends the driver's original
 * copyright display packet, and returns FFF6 (alternate-driver count -10).
 * It deliberately ignores both command-handshake failure return values. */
export function* initializeOriginalMt32(driver:Uint8Array):OriginalMt32MpuProgram{
 yield* commandOriginalMt32Mpu(0xff);
 yield {kind:'delay',loop:'decrement-dx',iterations:65536};
 yield* commandOriginalMt32Mpu(0x3f);
 const silence=applyOriginalMt32DriverControl('silence',0,new Uint8Array(46),new Uint8Array(100));
 for(const [,value] of silence.writes)yield* writeOriginalMt32Mpu(driver,value);
 yield* sendOriginalMt32SystemExclusive(driver,(_segment,at)=>driver[at],0,0x176,23);
 return 0xfff6;
}
