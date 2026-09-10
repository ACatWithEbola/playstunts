export interface NativeGameResourceHost {
 memory():Uint8Array;
 load(kind:number,nameOffset:number):Promise<{offset:number;segment:number}|null>;
 retry():Promise<number>;
}
/** Original1ad2c: try RES then PRE; if both fail, invoke the original retry
 * prompt and repeat. This caller ignores the prompt's returned choice. */
export async function loadNativeGameResource(host:NativeGameResourceHost,d:number,nameOffset:number,framePointer:number){
 return loadOriginalResourceFallback(host,d,nameOffset,framePointer,[[1,0x3398],[7,0x339d]]);
}
/** Shared original filename/local-frame operations, with caller-specific order. */
export async function loadOriginalResourceFallback(host:NativeGameResourceHost,d:number,nameOffset:number,framePointer:number,attempts:readonly (readonly [number,number])[]){
 const u=(n:number)=>n&65535,filename=u(framePointer-0x54);
 const copy=(destination:number,source:number)=>{for(let i=0;i<65536;i++){const value=host.memory()[d+u(source+i)];host.memory()[d+u(destination+i)]=value;if(!value)return;}throw Error('Original resource name is not terminated');};
 for(;;){
  for(const [kind,extension] of attempts){
   copy(filename,nameOffset);let end=filename,terminated=false;
   for(let i=0;i<65536;i++,end=u(end+1))if(!host.memory()[d+end]){terminated=true;break;}
   if(!terminated)throw Error('Original resource name is not terminated');copy(end,extension);
   const resource=await host.load(kind,filename),m=host.memory(),view=new DataView(m.buffer,m.byteOffset,m.byteLength);
   view.setUint16(d+u(framePointer-4),resource?.offset??0,true);view.setUint16(d+u(framePointer-2),resource?.segment??0,true);
   if(resource&&(resource.offset||resource.segment))return resource;
  }
  await host.retry();
 }
}
