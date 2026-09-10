export interface NativeReplayMemoryLoadHost {
 buildPath():void;
 read(offset:number,segment:number):Promise<void>;
}
/** Original149c4..14a19. The file service owns failure handling: this caller
 * copies the retained bank header after it returns and itself returns zero. */
export async function loadNativeReplayMemory(memory:Uint8Array,d:number,host:NativeReplayMemoryLoadHost){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 host.buildPath();memory[d+0x135]=1;
 await host.read(view.getUint16(d+0xa772,true),view.getUint16(d+0xa774,true));
 const offset=view.getUint16(d+0xa772,true),segment=view.getUint16(d+0xa774,true);
 for(let i=0;i<24;i+=2)view.setUint16(d+0x8fc2+i,view.getUint16(segment*16+((offset+i)&65535),true),true);
 memory[d+0x135]=0;return 0;
}
