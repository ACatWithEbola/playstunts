export interface NativeReplayMemoryWriter {
 write(offset:number,segment:number,length:number):Promise<number>;
}
/** Original14a1a..14a5f. The track and input bytes already occupy the
 * recording bank; only the24-byte configuration header is refreshed here.
 * The file service receives the original signed, wrapped length request. */
export async function saveNativeReplayMemory(memory:Uint8Array,d:number,host:NativeReplayMemoryWriter){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const offset=view.getUint16(d+0xa772,true),segment=view.getUint16(d+0xa774,true);
 for(let i=0;i<24;i+=2){
  const target=segment*16+((offset+i)&65535);
  memory[target]=memory[d+0x8fc2+i];memory[target+1]=memory[d+0x8fc2+i+1];
 }
 const length=(view.getUint16(d+0x8fd8,true)+0x722)<<16>>16;
 memory[d+0x135]=1;
 try{return (await host.write(offset,segment,length))<<24>>24;}
 finally{memory[d+0x135]=0;}
}
