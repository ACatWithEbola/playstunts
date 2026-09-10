import {readSoundCommand} from './sound-command.ts';
import {writeOriginalMt32Mpu,type OriginalMt32MpuProgram} from './mt32-transport.ts';

/** Original2AFDE E7/E8 parsing copies the payload into DS:6FA8 without
 * clearing its tail. The returned byte length is truncated at70C2. */
export function readOriginalMt32RawCommand(bytes:Uint8Array,offset:number,scratch:Uint8Array){
 const command=readSoundCommand(bytes,offset);
 if(command.opcode!==0xe7&&command.opcode!==0xe8)throw Error('Expected original raw sound command');
 let at=offset;while(bytes[at++]&128){}at++;
 const count=bytes[at++];if(scratch.length<256)throw Error('Missing original raw sound scratch');
 scratch.set(bytes.subarray(at,at+count),0);
 return {command,length:command.length&255,args:[((command.length&255)-4)&65535,0x6fa8]};
}

/** MT15:03BD uses a near DS pointer and16-bit LOOP, so a zero count means
 *65536 bytes. The caller supplies live DS reads, including wrap and stale
 * scratch bytes when the original count extends beyond the declared data. */
export function* sendOriginalMt32RawBytes(driver:Uint8Array,readDataByte:(offset:number)=>number,length:number,offset:number):OriginalMt32MpuProgram{
 const count=(length&65535)||65536;
 for(let i=0;i<count;i++)yield* writeOriginalMt32Mpu(driver,readDataByte((offset+i)&65535));
 return 0;
}
