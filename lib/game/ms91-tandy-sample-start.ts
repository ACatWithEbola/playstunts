function driverView(memory:Uint8Array,segment:number){
 if(memory.length<0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+3241>memory.length)throw Error('Invalid modern Tandy sample memory');
 return new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
}
/** TD15:0A48 requests stop; caller must keep delivering real IRQs until595=0. */
export function requestMs91TandySampleStop(memory:Uint8Array,segment:number){
 const view=driverView(memory,segment),base=segment*16;
 memory[base+0x5a6]=0;view.setUint16(base+0x57e,65535,true);memory[base+0x582]=1;
 return memory[base+0x595]===0;
}
/** TD15:0BA5 idle-device sample setup, after the prior stop has completed.
 * PIC mask is an explicit hardware-host read, not fabricated BIOS readiness.
 */
export function startMs91TandySample(memory:Uint8Array,driverSegment:number,request:{channel:number;offset:number;segment:number;frequency:number;repeats:number;picMask:number}){
 const view=driverView(memory,driverSegment),base=driverSegment*16;
 for(const key of ['channel','offset','segment','frequency','repeats'] as const)if(!Number.isInteger(request[key])||request[key]<0||request[key]>65535)throw Error('Invalid Tandy sample request word');
 if(!Number.isInteger(request.picMask)||request.picMask<0||request.picMask>255)throw Error('Invalid Tandy PIC mask');
 if(request.channel!==0)return {writes:[] as number[][],started:false};
 if(memory[base+0x595])throw Error('Prior Tandy transfer stop must complete before replacement');
 const at=(offset:number)=>((request.segment<<4)+(offset&65535))&0xfffff;
 const byte=(offset:number)=>memory[at(offset)],word=(offset:number)=>byte(offset)|(byte(offset+1)<<8);
 requestMs91TandySampleStop(memory,driverSegment);
 const start=(request.offset+0x32)&65535,differential=byte(request.offset+4)===6;
 memory[base+0x595]=255;memory[base+0x582]=request.repeats&255;
 if(differential){memory[base+0x5a7]=byte(start);memory[base+0x5a8]=byte(start);memory[base+0x5a6]=0;}
 for(const [offset,value] of [[0x578,start],[0x57a,request.segment],[0x57e,(start+Number(differential))&65535],[0x580,request.segment]])view.setUint16(base+offset,value,true);
 const length=word(request.offset+8);
 if(!length){memory[base+0x595]=0;return {writes:[] as number[][],started:false};}
 view.setUint16(base+0x57c,(start+length-1)&65535,true);
 view.setUint16(base+0x588,view.getUint16(0x20,true),true);view.setUint16(base+0x58a,view.getUint16(0x22,true),true);
 view.setUint16(0x20,differential?0xae4:0xa66,true);view.setUint16(0x22,driverSegment,true);
 const frequency=Math.max(100,Math.min(20000,request.frequency)),divisor=Math.floor(0x1234dc/frequency);
 const chainCount=Math.floor(view.getUint16(base+0x58c,true)/divisor);
 view.setUint16(base+0x58e,chainCount,true);view.setUint16(base+0x590,chainCount,true);view.setUint16(base+0x593,divisor,true);memory[base+0x592]=request.picMask;
 return {started:true,writes:[[0x43,0x36],[0x40,divisor&255],[0x40,divisor>>>8],[0xc4,3],[0x21,0xfc]]};
}
