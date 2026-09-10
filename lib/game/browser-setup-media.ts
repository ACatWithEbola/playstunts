import type {NativeSetupFile} from './native-setup-file-handles.ts';
type Entry={name:string;url:string;bytes:number;sha256:string;dosDateTime:number[]};
/** Read-only combined distribution mounted as A: for the original installer.
 * Supplied executable files are copied as bytes; this host never executes them. */
export async function loadBrowserSetupMedia(signal:AbortSignal){
 const response=await fetch('/game/setup-media/manifest.json',{signal});if(!response.ok)throw Error('Original setup media catalog could not load');
 const manifest=await response.json() as {files:Entry[]},files=new Map<string,NativeSetupFile>(),loaded=new Map<string,NativeSetupFile>();let next=0;
 await Promise.all(Array.from({length:8},async()=>{for(;;){const entry=manifest.files[next++];if(!entry)return;
  if(!/^[^\\/:]{1,12}$/.test(entry.name)||!entry.url.startsWith('/game/'))throw Error('Invalid original setup media entry');
  const resource=await fetch(encodeURI(entry.url),{signal});if(!resource.ok)throw Error('Original setup media missing: '+entry.name);
  const bytes=await resource.arrayBuffer(),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==entry.bytes||digest!==entry.sha256)throw Error('Original setup media does not match: '+entry.name);
  const [year,month,day,hour,minute,second]=entry.dosDateTime,date=((year-1980)<<9)|(month<<5)|day,time=(hour<<11)|(minute<<5)|(second>>>1);
  loaded.set(entry.name,{bytes:new Uint8Array(bytes),timestamp:((date<<16)|time)>>>0});
 }}));
 // Preserve source enumeration order independently of fetch completion order.
 for(const entry of manifest.files)files.set('A:\\'+entry.name,loaded.get(entry.name)!);
 return files;
}
