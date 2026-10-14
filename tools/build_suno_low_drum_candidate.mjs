/** Offline key36 candidate using an actual Suno waveform, not Roland PCM. */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,isAbsolute,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {sunoPitchFilter} from './suno_pitch_filter.mjs';
import {sunoSourceWindow} from './suno_source_window.mjs';
const [source,tracePath,destination,keyText='36',option]=process.argv.slice(2),key=Number(keyText);
const titleTom=option==='--title-tom'&&[41,45,48].includes(key);
const victoryTom=option==='--victory-tom'&&[41,43,45,48].includes(key),anyTom=titleTom||victoryTom;
const titleDrum=option==='--title-drum'&&[36,38,42,44,49].includes(key);
const resultDrum=['--gameover-drum','--victory-drum'].includes(option)&&[36,38,42,44,49].includes(key);
if(option&&!anyTom&&!titleDrum&&!resultDrum)throw Error('Unsupported explicit percussion trial');
if(![36,38,42,44,49,51].includes(key)&&!anyTom)throw Error('Unsupported provisional percussion mapping');
const sampleWindows={36:[17.835,.16],38:[23.965,.12],42:[1,.10],44:[2.795,.10],49:[0,1],51:[33.36,.20]};
const titleWindows={36:[4.245,.16],38:[4.68,.12],42:[7.285,.08],44:[5.67,.10],49:[23.005,.6]};
const resultWindows=option==='--gameover-drum'?{36:[3.115,.1],38:[.335,.12],42:[51.205,.08],44:[36.365,.1],49:[51.205,.3]}:{36:[9.785,.08],38:[6.04,.12],42:[36.715,.08],44:[31.56,.1],49:[.615,.25]};
const [sampleStart,sampleSeconds]=titleTom?[.15,.075]:victoryTom?[6.04,.12]:titleDrum?titleWindows[key]:resultDrum?resultWindows[key]:sampleWindows[key];
if(![source,tracePath,destination].every(path=>path&&isAbsolute(path))||existsSync(destination))throw Error('Require explicit inputs and NEW output');
const physical=join(realpathSync(dirname(destination)),basename(destination)),assets=realpathSync('public');
if(physical===assets||physical.startsWith(assets+'/'))throw Error('Not a public asset');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex'),before=[source,tracePath].map(hash);
let processedSource;
if(key===49&&!titleDrum&&!resultDrum){processedSource=JSON.parse(readFileSync(join(dirname(source),'manifest.json')));if(processedSource.kind!=='suno-percussive-residual'||processedSource.approvedForGame!==false||processedSource.outputFile!==basename(source)||processedSource.outputSha256!==before[0])throw Error('Key49 requires explicit unapproved residual provenance');}
const trace=JSON.parse(readFileSync(tracePath));if(trace.generation!=='ms-1991'||trace.sampleRate!==32000||![1920000,3200000,6400000].includes(trace.frames))throw Error('Require explicit60s/100s/200s modern capture');
const decoded=decodeDeliveredMidi(trace.events);if(decoded.partial||decoded.interruptions.some(event=>event.kind!=='unterminated-sysex'))throw Error('Incomplete capture');
const attacks=decoded.messages.filter(event=>event.frame>=0&&event.status===0x99&&event.data[0]===key&&event.data[1]>0);
const targetHz=anyTom?({41:95,43:95,45:128,48:victoryTom?177:176}[key]):null;
const sampleFilter=anyTom?[...(victoryTom?['highpass=f=90','lowpass=f=1200']:[]),...sunoPitchFilter(48000,Math.round(48000*targetHz/(victoryTom?173:265)))].join(','):(titleDrum||resultDrum)&&[42,44].includes(key)?'highpass=f=2000':(titleDrum||resultDrum)&&key===49?'highpass=f=180':[42,44,51].includes(key)?'highpass=f=180':null;
// A pitch-rate change also changes time: select the tom's source interval
// before that filter, not at the altered output timestamps.
const input=sunoSourceWindow(source,sampleStart,sampleSeconds,anyTom);
const rate=48000,raw=execFileSync('ffmpeg',['-v','error',...input,...(sampleFilter?['-af',sampleFilter]:[]),'-ar',String(rate),'-ac','2','-f','f32le','pipe:1']);
const sample=Float32Array.from({length:raw.length/4},(_,index)=>raw.readFloatLE(index*4));
let peak=0;for(const value of sample){if(!Number.isFinite(value))throw Error('Invalid source PCM');peak=Math.max(peak,Math.abs(value));}if(!peak)throw Error('Silent source');
let onset=0;while(onset<sample.length/2&&Math.max(Math.abs(sample[onset*2]),Math.abs(sample[onset*2+1]))<peak*.05)onset++;
const length=sample.length/2-onset,output=new Float32Array(trace.frames*rate/trace.sampleRate*2),events=[];
for(const attack of attacks){const start=Math.round(attack.frame*rate/trace.sampleRate);events.push({sourceFrame:attack.frame,outputFrame:start,key,velocity:attack.data[1]});
 for(let frame=0;frame<length&&start+frame<output.length/2;frame++){
  const envelope=Math.min(1,frame/(rate*.002),(length-frame)/(rate*.01))*attack.data[1]/127;
  for(let channel=0;channel<2;channel++)output[(start+frame)*2+channel]+=sample[(onset+frame)*2+channel]*envelope;
 }
}
let outputPeak=0;for(const value of output){if(!Number.isFinite(value)||Math.abs(value)>=1)throw Error('Candidate clips');outputPeak=Math.max(outputPeak,Math.abs(value));}
const wav=Buffer.alloc(44+output.length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*8,28);wav.writeUInt16LE(8,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(output.length*4,40);output.forEach((value,index)=>wav.writeFloatLE(value,44+index*4));
if([source,tracePath].some((path,index)=>hash(path)!==before[index]))throw Error('Source changed');
mkdirSync(destination);writeFileSync(join(destination,'key'+key+'-candidate.wav'),wav,{flag:'wx'});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({key,inputHashes:before,processedSource,rate,frames:output.length/2,events,sampleWindow:{start:sampleStart,seconds:sampleSeconds,onsetFrame:onset,thresholdFraction:.05,filter:sampleFilter},outputPeak,approvedForGame:false,drumIdentityVerified:false,sourceHitSeparationVerified:false,scope:'Provisional Suno percussion sample at original key timestamps;2ms attack/10ms tail fade, not complete rhythm or audible onset proof'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,hits:events.length,outputPeak,approvedForGame:false}));
