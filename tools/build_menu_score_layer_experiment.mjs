/** Bounded UNAPPROVED score-layer replacement experiment, never game assets. */
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {isAbsolute,resolve,dirname,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
const [mix,stem,reference,destination,durationText,bassStem,bassReference]=process.argv.slice(2);
if(!!bassStem!==!!bassReference||(bassStem&&(!isAbsolute(bassStem)||!isAbsolute(bassReference))))throw Error('Supply both absolute estimated bass and original bass reference');
const seconds=durationText===undefined?3:Number(durationText);
if(!Number.isFinite(seconds)||seconds<3||seconds>60)throw Error('Experiment duration must be3..60seconds');
if(![mix,stem,reference,destination].every(p=>p&&isAbsolute(p)))throw Error('Supply absolute mix, estimated guitar, original channel8 reference and NEW scratch directory');
const inputs=[mix,stem,reference,...(bassStem?[bassStem,bassReference]:[])].map(p=>realpathSync(p));
const target=join(realpathSync(dirname(destination)),basename(destination));
const publicRoot=realpathSync('public');
if(existsSync(destination)||target===publicRoot||target.startsWith(publicRoot+'/'))throw Error('Refusing existing/public destination');
if(inputs.some(p=>target===dirname(p)||target.startsWith(dirname(p)+'/')))throw Error('Refusing source directory output');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const hashes=inputs.map(hash),rate=48000,frames=Math.round(rate*seconds);
const cue=.7836402980239715,tempo=.9915744735989634;
const decode=(path,corrected)=>{
 const raw=execFileSync('ffmpeg',['-v','error','-i',path,...(corrected?['-af',`atrim=start=${cue},asetpts=PTS-STARTPTS,atempo=${tempo}`]:[]),'-t',String(seconds),'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});
 if(raw.length!==frames*8)throw Error('Each input must cover the requested duration');
 return Array.from({length:frames*2},(_,i)=>raw.readFloatLE(i*4));
};
const [source,guitar,scored,bass,scoredBass]=inputs.map((p,i)=>decode(p,i<2||i===3));
// WSOLA tempo processing is waveform-dependent. Equal parameters on two
// separate renders do not imply sample-aligned phases for subtraction.
const subtract='amerge=inputs=2,pan=stereo|c0=c0-c2|c1=c1-c3';
const residualRaw=execFileSync('ffmpeg',['-v','error','-i',inputs[0],'-i',inputs[1],...(bassStem?['-i',inputs[3]]:[]),
 '-filter_complex',`[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a];[1:a]aformat=sample_rates=48000:channel_layouts=stereo[b];[a][b]${subtract}${bassStem?'[g];[2:a]aformat=sample_rates=48000:channel_layouts=stereo[c];[g][c]'+subtract:''},atrim=start=${cue},asetpts=PTS-STARTPTS,atempo=${tempo}[out]`,
 '-map','[out]','-t',String(seconds),'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});
if(residualRaw.length!==frames*8)throw Error('Residual must cover the requested duration');
const residual=Array.from({length:frames*2},(_,i)=>residualRaw.readFloatLE(i*4));
const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
const gain=rms(guitar)/rms(scored);
if(!Number.isFinite(gain)||gain<=0||gain>10)throw Error('Unsafe reference gain');
const bassGain=bass?rms(bass)/rms(scoredBass):0;
if(bass&&(!Number.isFinite(bassGain)||bassGain<=0||bassGain>10))throw Error('Unsafe bass gain');
const scoredLayer=scored.map((v,i)=>v*gain+(scoredBass?scoredBass[i]*bassGain:0));
const candidate=residual.map((v,i)=>v+scoredLayer[i]);
const candidatePeak=candidate.reduce((peak,v)=>Math.max(peak,Math.abs(v)),0);
if(candidatePeak>=1)throw Error('Candidate clips');
const wav=samples=>{
 const b=Buffer.alloc(44+samples.length*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*8,28);b.writeUInt16LE(8,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(samples.length*4,40);
 samples.forEach((v,i)=>b.writeFloatLE(v,44+i*4));return b;
};
if(inputs.some((p,i)=>hash(p)!==hashes[i]))throw Error('Source changed');
mkdirSync(resolve(destination));
for(const [name,samples] of [['baseline',source],['residual',residual],['scored-layer',scoredLayer],['score-layer-candidate',candidate]])writeFileSync(join(destination,name+'.wav'),wav(samples),{flag:'wx'});
const report={inputs:inputs.map((path,i)=>({path,sha256:hashes[i]})),cue,tempo,referenceGain:gain,frames,rate,seconds,
 candidatePeak,bassReferenceGain:bassGain,replacedOriginalChannels:bassStem?[8,2]:[8],
 approvedForGame:false,individualNotesVerified:false,
 subtractionBeforeTempo:true,
 scope:'Subtract selected estimated stems in source sample space, then cue/stretch residual once and add original scored channels; separation leakage, waveform-dependent stretching and timbre change remain. Bounded excerpt, not seamless full-song replacement.'};
writeFileSync(join(destination,'manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,...report}));
