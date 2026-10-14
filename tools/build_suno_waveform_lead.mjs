/** Offline actual-waveform trial; no runtime integration or fidelity approval. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {dirname,basename,join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sunoPitchFilter} from './suno_pitch_filter.mjs';
const [source,reference,destination,layer='lead',filterPython]=process.argv.slice(2);
if(!['lead','bass','harmony'].includes(layer))throw Error('Unsupported waveform layer');
if(filterPython&&(layer!=='harmony'||!isAbsolute(filterPython)))throw Error('Filtered source requires harmony and absolute Python path');
if(![source,reference,destination].every(p=>p&&isAbsolute(p))||existsSync(destination))throw Error('Absolute inputs and NEW output required');
const physical=join(realpathSync(dirname(destination)),basename(destination)),pub=realpathSync('public');
if(physical===pub||physical.startsWith(pub+'/'))throw Error('Not a public asset');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const hashes=[source,reference].map(hash),manifest=JSON.parse(readFileSync(reference));
if((layer==='bass'?manifest.staticMenuControlsChecked!==true:manifest.channel!==(layer==='lead'?5:8))||manifest.rate!==48000||manifest.approvedForGame!==false||manifest.inputHashes[0]!==hashes[0])throw Error('Explicit offline Menu layer plan and matching source required');
const template={lead:{baseHz:741,windowSeconds:.08,sourceStart:8.91},bass:{baseHz:61.9,windowSeconds:.15,sourceStart:3.3},harmony:{baseHz:165.325,windowSeconds:.08,sourceStart:5.08}}[layer];
const rate=48000,sourceRate=32000,{baseHz,windowSeconds,sourceStart}=template;
const filteredTemplate=filterPython?execFileSync(filterPython,['tools/harmonic_waveform_filter.py',source,'--raw'],{maxBuffer:1024*1024}):null;
if(filteredTemplate&&filteredTemplate.length!==3840*8)throw Error('Incomplete filtered template');
const pcm=new Float32Array(manifest.frames*2),events=[];
const sampleCache=new Map();
for(const note of manifest.plan.notes){
 const start=Math.round(note.startFrame*rate/sourceRate),end=Math.round(note.releaseFrame*rate/sourceRate),length=end-start;
 if(!Number.isSafeInteger(length)||length<=0||end>manifest.frames)throw Error('Invalid note bounds');
 const targetHz=440*2**((note.pitch-69)/12),ratio=targetHz/baseHz;
 // FFmpeg asetrate is integer-valued: retain its actual ratio in provenance.
 const shiftedRate=Math.round(rate*ratio),actualRatio=shiftedRate/rate;
 const cacheKey=shiftedRate+':'+length,cached=sampleCache.get(cacheKey);
 let requestedTempo=(windowSeconds/actualRatio)/(length/rate),raw=cached?.raw,attempts=cached?.attempts??0;
 // Demucs stems are44.1kHz even when original exports are48kHz. Normalize
 // before reinterpreting sample rate, or pitch shifts acquire an extra48/44.1.
 // atempo output length differs for very short inputs. Measure real samples,
 // then retry a bounded number of times instead of padding missing music.
 while(!cached&&attempts++<6){
  let tempo=requestedTempo,chain=[];
  while(tempo<.5){chain.push('atempo=0.5');tempo/=.5;}
  while(tempo>2){chain.push('atempo=2');tempo/=2;}
  chain.push('atempo='+tempo);
  const filter=[...sunoPitchFilter(rate,shiftedRate),...chain].join(',');
  const input=filteredTemplate?['-f','f32le','-ar',String(rate),'-ac','2','-i','pipe:0']:['-ss',String(sourceStart),'-t',String(windowSeconds),'-i',source];
  raw=execFileSync('ffmpeg',['-v','error',...input,'-af',filter,'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{input:filteredTemplate??undefined,maxBuffer:16*1024*1024});
  if(raw.length>=length*8)break;
  if(raw.length===0)throw Error('Time stretch produced no real samples');
  requestedTempo*=raw.length/(length*8)*(layer==='harmony'?.95:.98);
 }
 if(!raw||raw.length<length*8)throw Error(`Time stretch cannot sustain pitch${note.pitch} at${note.startFrame}: requested${length} frames, received${raw?.length/8??0}; refuse silence padding`);
 if(!cached)sampleCache.set(cacheKey,{raw,attempts});
 let energy=0;
 for(let i=0;i<length;i++){
  const gain=Math.min(1,i/96,(length-1-i)/240)*note.velocity/127;
  for(let ch=0;ch<2;ch++){
   const value=raw.readFloatLE((i*2+ch)*4);
   if(!Number.isFinite(value))throw Error('Nonfinite waveform');
   energy+=value*value;pcm[(start+i)*2+ch]+=value*gain;
  }
 }
 if(energy===0)throw Error('Empty time-stretched note');
 events.push({...note,targetHz,actualRatio,stretchAttempts:attempts,actualStretchedFrames:raw.length/8,startOutputFrame:start,endOutputFrame:end});
}
let peak=0;for(const value of pcm)peak=Math.max(peak,Math.abs(value));
if(peak>=1)throw Error('Clipped candidate');
if([source,reference].some((p,i)=>hash(p)!==hashes[i]))throw Error('Input changed');
const wav=Buffer.alloc(44+pcm.length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*8,28);wav.writeUInt16LE(8,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(pcm.length*4,40);pcm.forEach((v,i)=>wav.writeFloatLE(v,44+i*4));
mkdirSync(destination);writeFileSync(join(destination,layer+'-waveform.wav'),wav,{flag:'wx'});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({layer,inputHashes:hashes,sourceProcessing:filteredTemplate?{kind:'shared-stereo-harmonic-mask',harmonics:32,widthHz:18,templateSha256:createHash('sha256').update(filteredTemplate).digest('hex')}:null,rate,frames:manifest.frames,baseHz,sourceStart,windowSeconds,events,peak,approvedForGame:false,sunoCharacterVerified:false,audibleTimingVerified:false,scope:'Actual estimated Suno waveform, FFmpeg pitch/time adjustment; provisional envelopes, no formant preservation or fine Roland expression. Short template may not sustain naturally.'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,notes:events.length,peak,approvedForGame:false}));
