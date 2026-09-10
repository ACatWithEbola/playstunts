import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
import {decodeTrackFile} from './track-file.ts';
/** Accept the original DOS track format without changing its contents. */
export function prepareTrackUpload(name:string,bytes:Uint8Array,directory:string):NativeStoredFile{
 if(!/^[a-z0-9_-]{1,8}\.trk$/i.test(name))throw Error('Choose a .TRK file with a name of 1–8 letters, numbers, underscores or hyphens. Rename longer filenames first.');
 decodeTrackFile(bytes);
 return {key:nativeFileKey(directory,name.slice(0,-4),'.TRK'),bytes:bytes.slice(),order:Date.now()};
}
