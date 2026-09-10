/** Supplied sound-command parser at loaded 0x2afde; music and effect commands. */
export function readSoundCommand(bytes:Uint8Array,offset=0){
 let pos=offset;
 const byte=()=>{if(pos>=bytes.length)throw Error('Truncated original sound command');return bytes[pos++];};
 const variable=()=>{let value=0,n;do{n=byte();value=((value<<7)+(n&127))>>>0;}while(n&128);return value;};
 const delay=variable(),opcode=byte();let argument:number|undefined,duration:number|undefined;
 if(opcode<0xd9){if(opcode>0x80)argument=byte();duration=variable();}
 else if([0xdc,0xdd,0xde,0xe0,0xe1,0xe2,0xe4,0xe9].includes(opcode))argument=byte();
 else if(opcode===0xdf){argument=byte();duration=byte();}
 else if(opcode===0xe5){const value=byte()|(byte()<<8);duration=(value<<16>>16)>>>0;}
 else if(opcode===0xe6){argument=byte();duration=(byte()|(byte()<<8)|(byte()<<16)|(byte()<<24))>>>0;}
 else if(opcode===0xe7||opcode===0xe8){const count=byte();for(let i=0;i<count;i++)byte();}
 // Values outside the original d9..e9 switch consume no payload.

 return {delay,opcode,argument,duration,length:pos-offset};
}
