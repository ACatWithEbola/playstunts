/** Original1A8FE..1A974: optional DOS path, name, then extension. Unlike the
 * sound loader, this always appends the requested extension. */
export function buildOriginalFilePath(memory:Uint8Array,d:number,path:number,name:number,extension:number,destination:number,framePointer:number){
 const u=(n:number)=>n&65535,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),byte=(at:number)=>memory[d+u(at)];
 const length=(at:number)=>{for(let i=0;i<65535;i++)if(!byte(at+i))return i;throw Error('Original filename has no bounded terminator');};
 const copy=(dst:number,src:number,alignSource:boolean)=>{
  const count=length(src)+1;let i=0;
  if((alignSource?src:dst)&1){memory[d+u(dst)]=byte(src);i++;}
  for(;i+1<count;i+=2)v.setUint16(d+u(dst+i),v.getUint16(d+u(src+i),true),true);
  if(i<count)memory[d+u(dst+i)]=byte(src+i);
 };
 if(path)copy(destination,path,false);else memory[d+u(destination)]=0;
 const size=path?length(path):0;
 const append=(src:number)=>copy(u(destination+length(destination)),src,true);
 if(size){const last=byte(path+size-1);memory[d+u(framePointer-2)]=last;if(last!==58&&last!==92)append(0x337b);}
 append(name);append(extension);return destination&65535;
}
