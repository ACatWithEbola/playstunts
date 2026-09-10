export interface NativeStoredFile {key:string;bytes:Uint8Array;order?:number}
export interface NativeFilePersistence {all():Promise<NativeStoredFile[]>;put(file:NativeStoredFile):Promise<void>;close?():void}
/** DOS-style paths within the native game's private virtual drive. */
export function nativeFileKey(path:string,name:string,extension:string,current='C:\\'){
 let directory=path.replace(/\//g,'\\');
 if(!/^[A-Za-z]:/.test(directory))directory=directory.startsWith('\\')?current.slice(0,2)+directory:current.replace(/\\?$/,'\\')+directory;
 const drive=directory.slice(0,2).toUpperCase(),parts:string[]=[];
 for(const part of directory.slice(2).split('\\')){if(!part||part==='.')continue;if(part==='..')parts.pop();else parts.push(part.toUpperCase());}
 return drive+'\\'+(parts.length?parts.join('\\')+'\\':'')+(name+extension).toUpperCase();
}
/** Original resources stay immutable. Writes overlay them in browser storage. */
export async function createNativeFileStore(original:ReadonlyMap<string,()=>Promise<Uint8Array>>,persistence:NativeFilePersistence){
 // IndexedDB getAll returns primary-key order. Retain directory slots because
 // the original chooser deliberately leaves exactly128 entries unsorted.
 // Legacy records keep their existing load order; their old creation order is unknown.
 const files=await persistence.all(),orderOf=(file:NativeStoredFile)=>Number.isSafeInteger(file.order)&&file.order!>0?file.order!:0;
 files.sort((a,b)=>orderOf(a)-orderOf(b));
 const saved=new Map(files.map(file=>[file.key,file.bytes.slice()])),orders=new Map(files.map(file=>[file.key,orderOf(file)]));
 let nextOrder=files.reduce((max,file)=>Math.max(max,orderOf(file)),0)+1;
 const directories=new Set(['C:\\']);
 for(const key of [...original.keys(),...saved.keys()]){for(let slash=key.indexOf('\\');slash>=0;slash=key.indexOf('\\',slash+1))directories.add(key.slice(0,slash+1));}
 const read=async(path:string,name:string,extension:string)=>{const key=nativeFileKey(path,name,extension),stored=saved.get(key);if(stored)return stored.slice();const load=original.get(key);if(!load)throw Error('File not found');return (await load()).slice();};
 return {
  read,close:()=>persistence.close?.(),
  exists(path:string,name:string,extension:string){const key=nativeFileKey(path,name,extension);return saved.has(key)||original.has(key);},
  enumerate(path:string,extension:string){const prefix=nativeFileKey(path,'',''),suffix=extension.toUpperCase();return [...new Set([...original.keys(),...saved.keys()])].filter(key=>key.startsWith(prefix)&&!key.slice(prefix.length).includes('\\')&&key.endsWith(suffix)).map(key=>key.slice(prefix.length));},
  async write(path:string,name:string,extension:string,bytes:Uint8Array){const key=nativeFileKey(path,name,extension),prefix=key.slice(0,key.lastIndexOf('\\')+1);if(!directories.has(prefix))throw Error('Directory not found');
   // The game's save-name editor accepts punctuation that its DOS create
   // service rejects. Do not persist a multi-dot name the chooser cannot reopen.
   const filename=key.slice(prefix.length);
   if(/[<>|"=:,;\/\[\]]/.test(filename)||filename.indexOf('.')!==filename.lastIndexOf('.'))throw Error('Invalid DOS filename');
   const file={key,bytes:bytes.slice(),order:orders.get(key)??nextOrder++};await persistence.put(file);saved.set(key,file.bytes);orders.set(key,file.order);},
 };
}
/** Dedicated native save database, separate from the retained DOS reference. */
export async function openNativeFilePersistence():Promise<NativeFilePersistence&{merge(files:NativeStoredFile[]):Promise<number>}>{
 const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('stunts-native-files',1);request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'key'});request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});
 return {
  close:()=>database.close(),
  merge: (files:NativeStoredFile[])=>new Promise<number>((resolve,reject)=>{const transaction=database.transaction('files','readwrite'),store=transaction.objectStore('files');let added=0;for(const file of files){const request=store.getKey(file.key);request.onsuccess=()=>{if(request.result===undefined){store.add(file);added++;}};}transaction.oncomplete=()=>resolve(added);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Import cancelled'));}),
  all:()=>new Promise((resolve,reject)=>{const request=database.transaction('files').objectStore('files').getAll();request.onsuccess=()=>resolve(request.result as NativeStoredFile[]);request.onerror=()=>reject(request.error);}),
  put:file=>new Promise((resolve,reject)=>{const transaction=database.transaction('files','readwrite');transaction.objectStore('files').put(file);transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Save cancelled'));}),
 };
}
