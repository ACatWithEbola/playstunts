import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
import {decodeOriginalReplayFile} from './replay-file.ts';
/** Validate an original recording and preserve its bytes for the native loader. */
export function prepareReplayUpload(name:string,bytes:Uint8Array,directory:string):NativeStoredFile{
 if(!/^[a-z0-9_-]{1,8}\.rpl$/i.test(name))throw Error('Choose a .RPL file with a name of 1–8 letters, numbers, underscores or hyphens. Rename longer filenames first.');
 if(bytes.length>0x722+65535)throw Error('Replay file is too large.');
 const replay=decodeOriginalReplayFile(bytes);
 if(!replay.inputs.length||replay.inputs.length>12000)throw Error('Replay must contain between 1 and 12,000 recorded frames.');
 return {key:nativeFileKey(directory,name.slice(0,-4),'.RPL'),bytes:bytes.slice(),order:Date.now()};
}
