'use client';
import {useState} from 'react';
import {browserTestAudioDiagnostics} from './research-browser-audio';
import {openNativeFilePersistence,createNativeFileStore} from '@/lib/game/native-file-store';
import {preparePrivateReplayUpload} from '@/lib/game/replay-upload';
export default function NativeFileAliasCheck(){
 const [report,setReport]=useState('Not run'),[running,setRunning]=useState(false);
 const run=async()=>{
  if(!browserTestAudioDiagnostics(window.location)){setReport('Local diagnostic flag required');return;}
  setRunning(true);setReport('Running isolated storage checks');
  let persistence:Awaited<ReturnType<typeof openNativeFilePersistence>>|undefined;
  try{
   const response=await fetch('/game/replays/CTKFIN.RPL');if(!response.ok)throw Error('Fixture unavailable');
   const bytes=new Uint8Array(await response.arrayBuffer()),equal=(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
   const check=(condition:boolean,label:string)=>{if(!condition)throw Error(label);};
   const database='stunts-native-alias-check-'+crypto.randomUUID();
   persistence=await openNativeFilePersistence(database);
   const key='C:\\\\saved\\copy.rpl';await persistence.put({key,bytes:bytes.slice(),physicsEngine:'ms-1991',framesPerSecond:10,order:1});
   const store=await createNativeFileStore(new Map(),persistence);
   check(equal(await store.read('C:\\SAVED\\','COPY','.RPL'),bytes),'Alias read');
   check(store.physicsEngine('C:\\SAVED\\','COPY','.RPL')==='ms-1991','Engine identity');
   check(store.framesPerSecond('C:\\SAVED\\','COPY','.RPL')===10,'Recording cadence');
   const upload=preparePrivateReplayUpload('COPY.RPL',bytes,'C:\\SAVED\\','ms-1990');
   check((await persistence.importReplay(upload)).status==='duplicate','Alias duplicate import');
   check(await persistence.merge([{...upload,key:'C:\\SAVED\\COPY.RPL'}])===0,'Alias merge');
   const name=String.fromCharCode(...bytes.slice(13,22)).split('\0')[0],trackKey='C:\\'+name.toLowerCase()+'.trk',personal=bytes.slice(24,0x722);personal[0]^=1;
   await persistence.put({key:trackKey,bytes:personal.slice()});
   const fresh=preparePrivateReplayUpload('FRESH.RPL',bytes,'C:\\','ms-1990');
   check((await persistence.importReplay(fresh)).status==='conflict','Track alias conflict');
   check((await persistence.importReplay(fresh,undefined,true)).status==='imported','Replay-only choice');
   const files=await persistence.all();check(files.length===3,'Unexpected fixture writes');
   const retained=files.find(f=>f.key===key)!;
   check(equal(retained.bytes,bytes)&&retained.physicsEngine==='ms-1991'&&retained.framesPerSecond===10,'Retained recording changed');
   check(equal(files.find(f=>f.key===trackKey)!.bytes,personal),'Track overwritten');
   setReport(JSON.stringify({passed:true,database,files:files.length,aliasRead:true,metadataRetained:true,duplicateProtected:true,trackProtected:true,replayOnlyImport:true,ordinarySaveDatabaseTouched:false,fixturePlaybackVerified:false}));
  }catch(error){setReport('Failed: '+String(error));}finally{persistence?.close?.();setRunning(false);}
 };
 return <main style={{padding:24}}><h1>Temporary private-file alias check</h1><p>Creates a separate test database. Does not alter ordinary saves. Fixture bytes test storage identity only, not playback.</p><button disabled={running} onClick={run}>Run isolated alias check</button><pre data-testid="testNativeFileAliases" style={{whiteSpace:'pre-wrap'}}>{report}</pre></main>;
}
