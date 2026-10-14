import {ORIGINAL_STARTER_TRACKS} from './original-starter-tracks.ts';
import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
import {replayTrackImport} from './replay-track-import.ts';
import {nativeStoredFileIdentity} from './native-file-identity.ts';
export interface NativeStoredFile {key:string;bytes:Uint8Array;order?:number;physicsEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion;framesPerSecond?:ReplayCadence}
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
 const retainedKeys=new Map<string,string>();
 for(const file of files){const key=nativeStoredFileIdentity(file.key);if(retainedKeys.has(key))throw Error('Ambiguous stored DOS filename');retainedKeys.set(key,file.key);}
 const saved=new Map(files.map(file=>[nativeStoredFileIdentity(file.key),file.bytes.slice()])),orders=new Map(files.map(file=>[nativeStoredFileIdentity(file.key),orderOf(file)]));
 const engines=new Map(files.map(file=>[nativeStoredFileIdentity(file.key),resolvePhysicsEngine(file.physicsEngine)]));
 const cadences=new Map(files.map(file=>[nativeStoredFileIdentity(file.key),resolveReplayCadence(file.framesPerSecond)]));
 // Keep legacy imported files readable, but omit exact synthetic duplicates
 // from the chooser. Never hide a modified track or delete its scores/replay.
 const hiddenTracks=new Set<string>();
 for(const track of ORIGINAL_STARTER_TRACKS){
  const canonical=nativeFileKey('',track.name,'.trk'),alias=nativeFileKey('','T'+track.sha256.slice(0,7),'.trk'),duplicate=saved.get(alias);
  if(!duplicate||duplicate.length!==track.raw.length||!duplicate.every((value,i)=>value===track.raw[i]))continue;
  const effective=saved.get(canonical)??(original.has(canonical)?await original.get(canonical)!():undefined);
  if(effective&&effective.length===duplicate.length&&effective.every((value,i)=>value===duplicate[i]))hiddenTracks.add(alias);
 }
 let nextOrder=files.reduce((max,file)=>Math.max(max,orderOf(file)),0)+1;
 const directories=new Set(['C:\\']);
 for(const key of [...original.keys(),...saved.keys()]){for(let slash=key.indexOf('\\');slash>=0;slash=key.indexOf('\\',slash+1))directories.add(key.slice(0,slash+1));}
 const read=async(path:string,name:string,extension:string)=>{const key=nativeFileKey(path,name,extension),stored=saved.get(key);if(stored)return stored.slice();const load=original.get(key);if(!load)throw Error('File not found');return (await load()).slice();};
 return {
  read,close:()=>persistence.close?.(),
  physicsEngine(path:string,name:string,extension:string){return resolvePhysicsEngine(engines.get(nativeFileKey(path,name,extension)));},
  framesPerSecond(path:string,name:string,extension:string){return resolveReplayCadence(cadences.get(nativeFileKey(path,name,extension)));},
  exists(path:string,name:string,extension:string){const key=nativeFileKey(path,name,extension);return saved.has(key)||original.has(key);},
  enumerate(path:string,extension:string){const prefix=nativeFileKey(path,'',''),suffix=extension.toUpperCase();return [...new Set([...original.keys(),...saved.keys()])].filter(key=>!hiddenTracks.has(key)&&key.startsWith(prefix)&&!key.slice(prefix.length).includes('\\')&&key.endsWith(suffix)).map(key=>key.slice(prefix.length));},
  async write(path:string,name:string,extension:string,bytes:Uint8Array,physicsEngine?:PhysicsEngineVersion,framesPerSecond?:ReplayCadence){const key=nativeFileKey(path,name,extension),prefix=key.slice(0,key.lastIndexOf('\\')+1);if(!directories.has(prefix))throw Error('Directory not found');
   // The game's save-name editor accepts punctuation that its DOS create
   // service rejects. Do not persist a multi-dot name the chooser cannot reopen.
   const filename=key.slice(prefix.length);
   if(Array.from(filename).some(character=>'<>|"=:,;/[]'.includes(character))||filename.indexOf('.')!==filename.lastIndexOf('.'))throw Error('Invalid DOS filename');
   const engine=resolvePhysicsEngine(physicsEngine),cadence=resolveReplayCadence(framesPerSecond),file={key:retainedKeys.get(key)??key,bytes:bytes.slice(),order:orders.get(key)??nextOrder++,...(physicsEngine?{physicsEngine:engine}:{}),...(framesPerSecond!==undefined?{framesPerSecond:cadence}:{})};await persistence.put(file);retainedKeys.set(key,file.key);saved.set(key,file.bytes);orders.set(key,file.order);engines.set(key,engine);cadences.set(key,cadence);
   if(key.endsWith('.TRK')){hiddenTracks.delete(key);for(const track of ORIGINAL_STARTER_TRACKS)if(key===nativeFileKey('',track.name,'.trk'))hiddenTracks.delete(nativeFileKey('','T'+track.sha256.slice(0,7),'.trk'));}},
 };
}
/** Dedicated native save database, separate from the retained DOS reference. */
export type ReplayTrackImportResult={status:'imported'|'duplicate'|'conflict'|'unsupported-name';trackAdded:boolean;trackName:string};
export async function openNativeFilePersistence(databaseName='stunts-native-files'):Promise<NativeFilePersistence&{merge(files:NativeStoredFile[],expected?:NativeStoredFile[]):Promise<number>;importReplay(replay:NativeStoredFile,bundledTrack?:Uint8Array,replayOnly?:boolean):Promise<ReplayTrackImportResult>}>{
 const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(databaseName,1);request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'key'});request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});
 return {
  close:()=>database.close(),
  importReplay:(replay,bundledTrack,replayOnly=false)=>new Promise((resolve,reject)=>{
   const source={...replay,bytes:replay.bytes.slice()},plan=replayTrackImport(source),bundled=bundledTrack?.slice();
   const transaction=database.transaction('files','readwrite'),store=transaction.objectStore('files');
   let result:ReplayTrackImportResult={status:'duplicate',trackAdded:false,trackName:plan.name};
   const keyLookup=store.getAllKeys();
   keyLookup.onsuccess=()=>{
    const matching=(key:string)=>keyLookup.result.filter(candidate=>typeof candidate==='string'&&nativeStoredFileIdentity(candidate)===nativeStoredFileIdentity(key));
    if(matching(source.key).length)return;
    if(plan.status==='unsupported-name'){
     result.status=replayOnly?'imported':'unsupported-name';if(replayOnly)store.add(source);return;
    }
    const trackKeys=matching(plan.track.key);if(trackKeys.length>1){result.status='conflict';return;}
    const trackLookup=store.get(trackKeys[0]??plan.track.key);
    trackLookup.onsuccess=()=>{
     const existing=(trackLookup.result as NativeStoredFile|undefined)?.bytes??bundled;
     const checked=replayTrackImport(source,existing);
     if(checked.status==='conflict'&&!replayOnly){result.status='conflict';return;}
     store.add(source);result.status='imported';
     if(checked.status==='missing'&&!replayOnly){store.add(plan.track);result.trackAdded=true;}
    };
   };
   transaction.oncomplete=()=>resolve(result);
   transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Replay import cancelled'));
  }),
  merge: (files:NativeStoredFile[],expected?:NativeStoredFile[])=>new Promise<number>((resolve,reject)=>{
   const copy=(file:NativeStoredFile)=>({...file,bytes:file.bytes.slice()});
   const retained=files.map(copy),snapshot=expected?.map(copy),transaction=database.transaction('files','readwrite'),store=transaction.objectStore('files');let added=0;
   // Ordinary backup merges need identities only; do not clone every retained
   // replay blob unless a shared-import plan actually needs snapshot validation.
   const request=snapshot?store.getAll():store.getAllKeys();request.onsuccess=()=>{
    const current=snapshot?request.result as NativeStoredFile[]:[];
    // Check the plan's entire read set inside the write transaction. A second
    // tab must not replace a reused track or recording between planning/save.
    if(snapshot){
     const byKey=new Map(current.map(file=>[file.key,file]));
     if(current.length!==snapshot.length||snapshot.some(file=>{
      const now=byKey.get(file.key);
      return !now||now.order!==file.order||now.physicsEngine!==file.physicsEngine||now.framesPerSecond!==file.framesPerSecond||now.bytes.length!==file.bytes.length||!now.bytes.every((value,i)=>value===file.bytes[i]);
     })){reject(Error('A file with this name already exists. Download and rename the replay instead.'));return;}
    }
    const keys=snapshot?current.map(file=>file.key):(request.result as IDBValidKey[]).filter((key):key is string=>typeof key==='string');
    const known=new Set(keys.map(nativeStoredFileIdentity));
    for(const file of retained){const identity=nativeStoredFileIdentity(file.key);if(known.has(identity))continue;known.add(identity);store.add(file);added++;}
   };
   transaction.oncomplete=()=>resolve(added);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Import cancelled'));
  }),
  all:()=>new Promise((resolve,reject)=>{const request=database.transaction('files').objectStore('files').getAll();request.onsuccess=()=>resolve(request.result as NativeStoredFile[]);request.onerror=()=>reject(request.error);}),
  put:file=>new Promise((resolve,reject)=>{const transaction=database.transaction('files','readwrite');transaction.objectStore('files').put(file);transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error??Error('Save cancelled'));}),
 };
}
