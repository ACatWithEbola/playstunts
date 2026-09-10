export interface NativeResourceDispatchHost {
 memory():Uint8Array;
 load(kind:number,nameOffset:number):Promise<{offset:number;segment:number}|null>;
 retry():Promise<number>;
}
/** Original1BCF8 resource service: kinds1/7 return optional loads directly.
 * Other recognized kinds retry until success or original dialog choice2. */
export async function dispatchNativeResourceLoad(host:NativeResourceDispatchHost,d:number,kind:number,nameOffset:number,framePointer:number){
 kind&=65535;
 const word=(at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+(at&65535),true);};
 for(;;){
  if(kind<=8){
   const pointer=await host.load(kind,nameOffset);
   if(kind===1||kind===7)return pointer&&(pointer.offset||pointer.segment)?pointer:null;
   const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);
   v.setUint16(d+((framePointer-4)&65535),pointer?.offset??0,true);v.setUint16(d+((framePointer-2)&65535),pointer?.segment??0,true);
  }
  const offset=word(framePointer-4),segment=word(framePointer-2);
  if(offset||segment)return {offset,segment};
  if((await host.retry()&65535)===2)return null;
 }
}
