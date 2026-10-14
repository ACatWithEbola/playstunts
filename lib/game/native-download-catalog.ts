import type {NativeStoredFile} from './native-file-store.ts';
import {nativeStoredFileIdentity} from './native-file-identity.ts';

/** Match the game's saved-overlay semantics, without rewriting retained keys. */
export function effectiveNativeDownloads(bundled:readonly NativeStoredFile[],saved:readonly NativeStoredFile[]){
 const files=new Map<string,NativeStoredFile>(),seen=new Set<string>();
 const copy=(file:NativeStoredFile)=>({...file,bytes:file.bytes.slice()});
 for(const file of bundled)if(/\.(TRK|RPL)$/i.test(file.key))files.set(nativeStoredFileIdentity(file.key),copy(file));
 for(const file of saved){
  if(!/\.(TRK|RPL)$/i.test(file.key))continue;
  const identity=nativeStoredFileIdentity(file.key);
  if(seen.has(identity))throw Error('Ambiguous stored DOS filename');
  seen.add(identity);files.set(identity,copy(file));
 }
 return [...files.values()].sort((a,b)=>a.key.localeCompare(b.key));
}
