export interface NativeSetupFile {bytes:Uint8Array;timestamp:number}
export interface NativeSetupFileStorage {
 resolve?(path:string):string;
 read(path:string):Promise<NativeSetupFile|null>;
 write(path:string,file:NativeSetupFile):Promise<void>;
 now():number;
}
/** Browser-owned file handles for the native SETUP program. Storage resolves
 * DOS paths and owns persistence; original installer code owns copy ordering. */
export function createNativeSetupFileHandles(storage:NativeSetupFileStorage){
 const handles=new Map<number,{path:string;position:number;writable:boolean}>();
 const allocate=(path:string,writable:boolean)=>{for(let handle=3;handle<32768;handle++)if(!handles.has(handle)){handles.set(handle,{path,position:0,writable});return handle;}return -1;};
 return {
  async open(path:string,mode:number){path=storage.resolve?.(path)??path;if(mode!==0)return -1;try{return await storage.read(path)?allocate(path,false):-1;}catch{return -1;}},
  async create(path:string,attribute:number){path=storage.resolve?.(path)??path;if(attribute!==0)return -1;const handle=allocate(path,true);if(handle<0)return -1;try{await storage.write(path,{bytes:new Uint8Array(),timestamp:storage.now()});return handle;}catch{handles.delete(handle);return -1;}},
  async read(handle:number,limit:number){const file=handles.get(handle);if(!file||!Number.isInteger(limit)||limit<0||limit>32767)return {result:-1,bytes:new Uint8Array()};
   try{const stored=await storage.read(file.path);if(!stored)return {result:-1,bytes:new Uint8Array()};const bytes=stored.bytes.slice(file.position,file.position+limit);file.position+=bytes.length;return {result:bytes.length,bytes};}catch{return {result:-1,bytes:new Uint8Array()};}
  },
  async write(handle:number,bytes:Uint8Array){const file=handles.get(handle);if(!file?.writable||bytes.length>32767)return -1;
   try{const stored=await storage.read(file.path);if(!stored)return -1;const next=new Uint8Array(bytes.length?Math.max(stored.bytes.length,file.position+bytes.length):file.position);next.set(stored.bytes.subarray(0,next.length));next.set(bytes,file.position);await storage.write(file.path,{bytes:next,timestamp:storage.now()});file.position+=bytes.length;return bytes.length;}catch{return -1;}
  },
  close(handle:number){return handles.delete(handle)?0:-1;},
  async copyTimestamp(source:number,destination:number){const from=handles.get(source),to=handles.get(destination);if(!from||!to?.writable)throw Error('Original SETUP timestamp handle is closed');const a=await storage.read(from.path),b=await storage.read(to.path);if(!a||!b)throw Error('Original SETUP timestamp file is missing');await storage.write(to.path,{bytes:b.bytes.slice(),timestamp:a.timestamp});},
  closeAll(){handles.clear();}
 };
}
