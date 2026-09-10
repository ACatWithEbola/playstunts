export interface OriginalResourceFile {file:string;bytes:number;sha256:string}
/** Read-only supplied-game files. DOS directory prefixes refer to this mounted
 * distribution; user track/replay overlays remain owned by the menu file store. */
export function createNativeResourceCatalog(files:Record<string,OriginalResourceFile>,read:(file:string)=>Promise<Uint8Array>){
 const entries=new Map(Object.entries(files).map(([name,file])=>[name.toUpperCase(),file]));
 const cache=new Map<string,Promise<Uint8Array>>();
 const key=(name:string)=>name.replaceAll('/','\\').split('\\').pop()!.toUpperCase();
 return {
  exists(name:string){return entries.has(key(name));},
  async read(name:string):Promise<Uint8Array|null>{
   const normalized=key(name),entry=entries.get(normalized);if(!entry)return null;
   let pending=cache.get(normalized);
   if(!pending){pending=read(entry.file).then(bytes=>{if(bytes.length!==entry.bytes)throw Error('Original resource length mismatch: '+entry.file);return bytes.slice();}).catch(error=>{cache.delete(normalized);throw error;});cache.set(normalized,pending);}
   return (await pending).slice();
  },
 };
}
export async function loadBrowserOriginalResourceCatalog(){
 const root='/game/original-resources/',response=await fetch(root+'manifest.json');
 if(!response.ok)throw Error('Original resource catalog could not load');
 const manifest=await response.json() as {files:Record<string,OriginalResourceFile>};
 return createNativeResourceCatalog(manifest.files,async file=>{
  const response=await fetch(root+encodeURIComponent(file));if(!response.ok)throw Error('Original resource could not load: '+file);
  return new Uint8Array(await response.arrayBuffer());
 });
}
