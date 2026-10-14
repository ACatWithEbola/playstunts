import type {NativeStoredFile} from './native-file-store.ts';
import {validateBackupGameFile} from './upload-validation.ts';
import {resolvePhysicsEngine} from '../physics/engine-version.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
import {nativeStoredFileIdentity} from './native-file-identity.ts';
const limit=32*1024*1024;
export function encodeSaveBackup(files:NativeStoredFile[],directory:string){
 return JSON.stringify({format:'playstunts-backup',version:1,directory,files:files.map(file=>{let binary='';for(let i=0;i<file.bytes.length;i+=8192)binary+=String.fromCharCode(...file.bytes.subarray(i,i+8192));return {...file,bytes:btoa(binary)};})});
}
export function decodeSaveBackup(text:string):{files:NativeStoredFile[];directory:string}{
 if(text.length>limit)throw Error('Backup is too large (maximum 32 MB).');
 const value=JSON.parse(text);if(value?.format!=='playstunts-backup'||value.version!==1||!Array.isArray(value.files)||value.files.length>10000)throw Error('This is not a supported Stunts backup.');
 const validPath=(key:unknown):key is string=>typeof key==='string'&&/^[A-Z]:\\/i.test(key)&&key.length<=260&&!key.split('\\').some(p=>p==='..'||p==='.')&&!Array.from(key).some(character=>character.charCodeAt(0)<=0x1f);
 if(!validPath(value.directory))throw Error('Invalid backup directory.');
 const seen=new Set<string>();
 const files=value.files.map((file:NativeStoredFile&{bytes:string;timestamp?:number})=>{
  if(!file||!validPath(file.key)||typeof file.bytes!=='string')throw Error('Invalid or duplicate file in backup.');
  // DOS file identity is case-insensitive and ignores repeated directory
  // separators. Reject ambiguous aliases, without rewriting retained keys.
  const identity=nativeStoredFileIdentity(file.key);
  if(seen.has(identity))throw Error('Invalid or duplicate file in backup.');seen.add(identity);
  const binary=atob(file.bytes);if(btoa(binary)!==file.bytes)throw Error('Invalid backup file data.');
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));validateBackupGameFile(file.key,bytes);
  return {key:file.key,bytes,...(file.physicsEngine!==undefined?{physicsEngine:resolvePhysicsEngine(file.physicsEngine)}:{}),...(file.framesPerSecond!==undefined?{framesPerSecond:resolveReplayCadence(file.framesPerSecond)}:{}),...(Number.isSafeInteger(file.order)&&file.order!>0?{order:file.order}:{}),...(Number.isFinite(file.timestamp)?{timestamp:file.timestamp}:{})};
 });
 return {files,directory:value.directory};
}
