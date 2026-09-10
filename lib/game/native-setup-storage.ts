import type {NativeFilePersistence,NativeStoredFile} from './native-file-store.ts';
import type {NativeSetupFile} from './native-setup-file-handles.ts';
/** Private virtual drives for SETUP. Originals are immutable; created folders
 * and copied files use the native game's existing browser overlay database. */
export async function createNativeSetupStorage(original:ReadonlyMap<string,NativeSetupFile>,persistence:NativeFilePersistence,readOnlyDrives:ReadonlySet<string>=new Set(['A','B'])){
 const saved=new Map<string,NativeSetupFile>(),directories=new Set<string>(['C:\\']),current=new Map<string,string>();let drive='C';
 const directory=(key:string)=>key.endsWith('\\')?key:key+'\\';
 const addParents=(key:string)=>{const parts=key.split('\\');let at=parts[0]+'\\';directories.add(at);for(let i=1;i<parts.length-1;i++){at+=parts[i]+'\\';directories.add(at);}};
 for(const key of original.keys())addParents(key);
 for(const file of await persistence.all()){if(file.key.endsWith('\\'))directories.add(file.key);else saved.set(file.key,{bytes:file.bytes.slice(),timestamp:(file as NativeStoredFile&{timestamp?:number}).timestamp??0});addParents(file.key);}
 const resolve=(path:string)=>{path=path.replaceAll('/','\\').toUpperCase();const explicit=/^[A-Z]:/.test(path),selected=explicit?path[0]:drive,tail=explicit?path.slice(2):path,parts=tail.startsWith('\\')?[]:(current.get(selected)??'').split('\\').filter(Boolean);for(const part of tail.split('\\')){if(!part||part==='.')continue;if(part==='..')parts.pop();else parts.push(part);}return selected+':\\'+parts.join('\\');};
 const get=(key:string)=>saved.get(key)??original.get(key);
 const storage={resolve,now:()=>Date.now(),
  async read(path:string){const value=get(resolve(path));return value?{bytes:value.bytes.slice(),timestamp:value.timestamp}:null;},
  async write(path:string,file:NativeSetupFile){const key=resolve(path),parent=key.slice(0,key.lastIndexOf('\\')+1);if(readOnlyDrives.has(key[0])||!directories.has(parent)||directories.has(directory(key)))throw Error('Virtual SETUP destination is unavailable');const stored={key,bytes:file.bytes.slice(),timestamp:file.timestamp};await persistence.put(stored);saved.set(key,{bytes:stored.bytes,timestamp:stored.timestamp});},
  async makeDirectory(path:string){const key=directory(resolve(path)),parent=key.slice(0,-1).slice(0,key.slice(0,-1).lastIndexOf('\\')+1);if(readOnlyDrives.has(key[0])||directories.has(key)||get(key.slice(0,-1))||!directories.has(parent))return -1;try{await persistence.put({key,bytes:new Uint8Array()});directories.add(key);return 0;}catch{return -1;}},
  changeDrive(index:number){const selected=String.fromCharCode(65+index);if(directories.has(selected+':\\'))drive=selected;return Math.max(...Array.from(directories,key=>key.charCodeAt(0)-64));},
  changeDirectory(path:string){const key=resolve(path);if(!directories.has(directory(key)))return -1;current.set(key[0],key.slice(3));return 0;},
  find(path:string,attribute:number){const key=resolve(path),slash=key.lastIndexOf('\\'),parent=key.slice(0,slash+1),pattern=key.slice(slash+1),literal=!/[?*]/.test(pattern);
   if(literal){if(get(key))return [pattern];if(attribute&16&&directories.has(directory(key)))return [pattern];return [];}
   const escaped=(pattern==='*.*'?'*':pattern).replace(/[.+^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*').replaceAll('?','.');const match=new RegExp('^'+escaped+'$'),names=new Set<string>();
   for(const candidate of [...original.keys(),...saved.keys()])if(candidate.startsWith(parent)){const name=candidate.slice(parent.length);if(!name.includes('\\')&&match.test(name))names.add(name);}
   if(attribute&16)for(const candidate of directories)if(candidate.startsWith(parent)){const name=candidate.slice(parent.length,-1);if(name&&!name.includes('\\')&&match.test(name))names.add(name);}
   return [...names];
  },
  close:()=>persistence.close?.(),
 };
 return storage;
}
