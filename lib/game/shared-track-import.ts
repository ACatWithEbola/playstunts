import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
import {nativeStoredFileIdentity} from './native-file-identity.ts';
import {ORIGINAL_STARTER_TRACKS} from './original-starter-tracks.ts';
import {prepareTrackUpload} from './track-upload.ts';
import {ms91DemoTrack} from './ms91-demo-track.ts';

/** Shared files must not silently replace a saved or bundled DOS track. */
export function prepareSharedTrackImport(name:string,hash:string,bytes:Uint8Array,directory:string,existing:NativeStoredFile[]){
 if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid track identity');
 const catalog=new Map<string,Uint8Array>(ORIGINAL_STARTER_TRACKS.map(track=>[nativeFileKey('',track.name,'.trk'),Uint8Array.from(track.raw)]));
 const demo=ms91DemoTrack();catalog.set(nativeFileKey('',demo.name,'.trk'),demo.bytes);
 const retained=new Set<string>();
 for(const file of existing){const identity=nativeStoredFileIdentity(file.key);if(retained.has(identity))throw Error('Track filename is already in use. Download and rename the file first.');retained.add(identity);catalog.set(identity,file.bytes);}
 const names=[name,...Array.from({length:6},(_,index)=>{const length=index+3;return name.slice(0,8-length)+hash.slice(0,length).toUpperCase();})];
 for(const candidate of names){
  const prepared=prepareTrackUpload(candidate+'.TRK',bytes,directory),occupied=catalog.get(prepared.key);
  if(occupied&&(occupied.length!==bytes.length||!occupied.every((value,i)=>value===bytes[i])))continue;
  const selected=prepared.key.slice(prepared.key.lastIndexOf('\\')+1,-4);
  return {selected,files:occupied?[]:[prepared]};
 }
 throw Error('Track filename is already in use. Download and rename the file first.');
}
