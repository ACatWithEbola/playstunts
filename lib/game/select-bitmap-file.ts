export interface OriginalBitmapFileHost {
 memory():Uint8Array;
 cached(nameOffset:number):{offset:number;segment:number}|null;
 exists(nameOffset:number):Promise<boolean>;
}
/** Original2c432 filename/cache prefix. The caller supplies the retained stack
 * frame used for names and locals; extension search order comes from DS:5290. */
export async function selectOriginalBitmapFile(host:OriginalBitmapFileHost,d:number,nameOffset:number,framePointer:number,layout={extensionTable:0x5290,filenameDistance:0x7c,frameSize:0x80,cacheBeforeFiles:false}){
 const u=(n:number)=>n&65535,at=(n:number)=>d+u(n),byte=(n:number)=>host.memory()[at(n)];
 const word=(n:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(at(n),true);};
 const put=(n:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(at(n),u(value),true);};
 const copy=(destination:number,source:number)=>{for(let i=0;i<65536;i++){const value=byte(source+i);host.memory()[at(destination+i)]=value;if(!value)return;}throw Error('Original bitmap filename is not terminated');};
 const filename=u(framePointer-layout.filenameDistance),extension=u(framePointer-0xa),lookup=()=>{
  const p=host.cached(filename);put(framePointer-4,p?.offset??0);put(framePointer-2,p?.segment??0);return p;
 };
 copy(filename,nameOffset);put(framePointer-0xc,filename);
 for(;;){const value=byte(word(framePointer-0xc));host.memory()[at(framePointer-layout.frameSize)]=value;if(!value||value===46)break;put(framePointer-0xc,word(framePointer-0xc)+1);}
 if(byte(word(framePointer-0xc))){const cached=lookup();if(cached)return {cached,filename,extension};}
 else {
  if(layout.cacheBeforeFiles){
   put(framePointer-0x14,0);
   for(let guard=0;;guard++){
    if(guard>=32768)throw Error('Original bitmap extension list has no terminator');
    const suffix=word(layout.extensionTable+word(framePointer-0x14)*2);if(!byte(suffix))break;
    put(framePointer-0x12,word(framePointer-0xc));copy(word(framePointer-0xc),suffix);
    const cached=lookup();if(cached)return {cached,filename,extension};
    put(framePointer-0x14,word(framePointer-0x14)+1);
   }
  }
  put(framePointer-0x14,0);
  for(let guard=0;;guard++){
   if(guard>=32768)throw Error('Original bitmap extension list has no terminator');
   const suffix=word(layout.extensionTable+word(framePointer-0x14)*2);if(!byte(suffix))break;
   put(framePointer-0x12,word(framePointer-0xc));copy(word(framePointer-0xc),suffix);
   if(!layout.cacheBeforeFiles){const cached=lookup();if(cached)return {cached,filename,extension};}
   if(await host.exists(filename))break;
   put(framePointer-0x14,word(framePointer-0x14)+1);
  }
 }
 copy(extension,word(framePointer-0xc));return {cached:null,filename,extension};
}
