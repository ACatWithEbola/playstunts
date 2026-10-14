import {decodeOriginalReplayFile} from './replay-file.ts';
import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
/** Inspect canonical replay bytes without rewriting its recorded track name.
 * Caller resolves the effective bundled/personal track before committing. */
export function replayTrackImport(replay:NativeStoredFile,existing?:Uint8Array){
 decodeOriginalReplayFile(replay.bytes);
 const name=String.fromCharCode(...replay.bytes.subarray(13,22)).split('\0')[0];
 if(!/^[a-z0-9_-]{1,8}$/i.test(name))return {status:'unsupported-name' as const,name};
 const directory=replay.key.slice(0,replay.key.lastIndexOf('\\')+1);
 const track={key:nativeFileKey(directory,name,'.TRK'),bytes:replay.bytes.slice(24,0x722)};
 if(existing)return {status:existing.length===track.bytes.length&&existing.every((byte,i)=>byte===track.bytes[i])?'present' as const:'conflict' as const,name,track};
 return {status:'missing' as const,name,track};
}
