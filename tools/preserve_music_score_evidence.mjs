/** Preserve explicit original-reference evidence, not ROMs or game assets. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,realpathSync,constants} from 'node:fs';
import {join,isAbsolute,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
const [source,destination]=process.argv.slice(2);
if(!source||!destination||![source,destination].every(isAbsolute)||existsSync(destination))throw Error('Require absolute source and NEW evidence destination');
const physical=join(realpathSync(dirname(destination)),basename(destination)),assets=realpathSync('public');
if(physical===assets||physical.startsWith(assets+'/'))throw Error('Evidence must remain outside public assets');
const hash=b=>createHash('sha256').update(b).digest('hex'),files=[],songs=[];
const referenceManifest=readFileSync(join(source,'manifest.json')),reference=JSON.parse(referenceManifest);
if(reference.generation!=='ms-1991'||reference.seconds!==60||reference.isolation?.channel!==2||reference.isolation.note!==null||reference.isolation.unfilteredSettlingAuthority!==true||!reference.traceMidi)throw Error('Require explicitly isolated bass reference manifest');
for(const song of ['titl','slct','vict','over']){
 const traceName=song+'-delivered-midi.json',wavName=song+'.wav',traceBytes=readFileSync(join(source,traceName)),wav=readFileSync(join(source,wavName));
 const trace=JSON.parse(traceBytes),decoded=decodeDeliveredMidi(trace.events);
 if(trace.generation!=='ms-1991'||trace.sampleRate!==32000||trace.frames!==1920000||!trace.startupEventsRetained||decoded.interruptions.some(event=>event.kind!=='unterminated-sysex')||decoded.partial)throw Error('Incomplete reference trace');
 if(wav.length!==44+trace.frames*4||wav.toString('ascii',0,4)!=='RIFF'||wav.readUInt32LE(24)!==trace.sampleRate||wav.readUInt16LE(22)!==2||wav.readUInt16LE(34)!==16)throw Error('Unexpected reference PCM');
 files.push({name:traceName,sha256:hash(traceBytes)},{name:wavName,sha256:hash(wav)});
 songs.push({song,frames:trace.frames,messages:decoded.messages.length,rawAbortedSysEx:decoded.interruptions,realtime:decoded.realtime,noteAttacks:decoded.messages.filter(m=>(m.status&240)===144&&m.data[1]&&m.frame>=0).length,intendedNotesVerified:false});
}
files.push({name:'manifest.json',sha256:hash(referenceManifest)});
mkdirSync(destination);
for(const entry of files){copyFileSync(join(source,entry.name),join(destination,entry.name),constants.COPYFILE_EXCL);if(hash(readFileSync(join(destination,entry.name)))!==entry.sha256)throw Error('Copied evidence differs');}
writeFileSync(join(destination,'evidence-index.json'),JSON.stringify({source,files,songs,includesAllDeliveredVoices:true,pcmIsBassIsolation:true,romsIncluded:false,productionDataIncluded:false,enhancedAudioApproved:false},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,copiedFiles:files.length,hashesVerified:true,romsIncluded:false,enhancedAudioApproved:false}));
