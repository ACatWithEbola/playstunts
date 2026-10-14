import {nativeFileKey,type NativeStoredFile} from './native-file-store.ts';
import {nativeStoredFileIdentity} from './native-file-identity.ts';
import {ORIGINAL_STARTER_TRACKS} from './original-starter-tracks.ts';
import {scoreString} from './global-score-format.ts';
import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
import {ms91DemoTrack} from './ms91-demo-track.ts';
const same=(a:ArrayLike<number>,b:ArrayLike<number>)=>a.length===b.length&&Array.from(a).every((value,i)=>value===b[i]);
export function sharedReplayTrackName(hash:string){
 return ORIGINAL_STARTER_TRACKS.find(track=>track.sha256===hash)?.name??'T'+hash.slice(0,7).toUpperCase();
}
/** Reuse effective local tracks, including saved overlays of original files. */
export function prepareSharedReplayImport(source:Uint8Array,id:string,directory:string,existing:NativeStoredFile[],physicsEngine?:PhysicsEngineVersion){
 const engine=resolvePhysicsEngine(physicsEngine);
 const retained=new Map<string,NativeStoredFile>();
 for(const file of existing){
  const identity=nativeStoredFileIdentity(file.key);
  if(retained.has(identity))throw Error('A file with this name already exists. Download and rename the replay instead.');
  retained.set(identity,file);
 }
 const bytes=source.slice(),track=bytes.slice(24,0x722),prefix=nativeFileKey(directory,'','');
 const catalog=new Map<string,Uint8Array>(ORIGINAL_STARTER_TRACKS.map(item=>[nativeFileKey('',item.name,'.trk'),Uint8Array.from(item.raw)]));
 const demo=ms91DemoTrack();catalog.set(nativeFileKey('',demo.name,'.trk'),demo.bytes);
 for(const [identity,file] of retained)catalog.set(identity,file.bytes);
 const inDirectory=(key:string)=>key.startsWith(prefix)&&!key.slice(prefix.length).includes('\\');
 const matches=[...catalog].filter(([key,data])=>inDirectory(key)&&key.endsWith('.TRK')&&same(data,track));
 matches.sort(([a],[b])=>Number(/^T[0-9A-F]{7}\.TRK$/.test(a.slice(prefix.length)))-Number(/^T[0-9A-F]{7}\.TRK$/.test(b.slice(prefix.length))));
 const requested=scoreString(bytes,13,22).toUpperCase();
 let name=matches[0]?.[0].slice(prefix.length,-4)??requested;
 if(!/^[A-Z0-9_-]{1,8}$/.test(name))throw Error('Invalid replay track filename');
 const trackKey=nativeFileKey(directory,name,'.trk');
 const occupied=catalog.get(trackKey);
 if(occupied&&!same(occupied,track))throw Error('A file with this name already exists. Download and rename the replay instead.');
 bytes.fill(0,13,22);bytes.set(Array.from(name,c=>c.charCodeAt(0)),13);
 const replayName='R'+id.slice(0,7).toUpperCase(),replayKey=nativeFileKey(directory,replayName,'.rpl');
 const prior=retained.get(replayKey);
 // A legacy imported replay may differ only by its generated track label.
 if(prior){
  // Canonical layouts can be byte-identical across engines; control bytes alone
  // must never authorize reusing a file recorded with different physics.
  // Public canonical recordings run at20Hz; a private slow-mode file may have
  // identical bytes and engine but must retain its own10Hz playback identity.
  if(resolvePhysicsEngine(prior.physicsEngine)!==engine||resolveReplayCadence(prior.framesPerSecond)!==20)throw Error('A file with this name already exists. Download and rename the replay instead.');
  const normalized=prior.bytes.slice();normalized.fill(0,13,22);const compare=bytes.slice();compare.fill(0,13,22);if(!same(normalized,compare))throw Error('A file with this name already exists. Download and rename the replay instead.');
 }
 return {replayName,files:[...(!occupied?[{key:trackKey,bytes:track}]:[]),...(!prior?[{key:replayKey,bytes,...(physicsEngine?{physicsEngine:engine}:{})}]:[])]};
}
