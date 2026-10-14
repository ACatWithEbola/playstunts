/** Bounded offline mix. No normalization, clipping concealment or promotion. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,dirname,basename,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),options=args.filter(v=>v.startsWith('--seconds='));
if(options.length>1)throw Error('Duplicate duration option');
const seconds=Number(options[0]?.slice(10)??60);
if(![60,100,200].includes(seconds))throw Error('Require explicit60s/100s/200s mix');
const [destination,...inputs]=args.filter(v=>!v.startsWith('--seconds='));
if(!destination||!isAbsolute(destination)||existsSync(destination)||inputs.length<2||inputs.length>16||inputs.some(p=>!isAbsolute(p)))throw Error('Require NEW offline destination and2..16 absolute inputs');
const physical=join(realpathSync(dirname(destination)),basename(destination)),assets=realpathSync('public');
if(physical===assets||physical.startsWith(assets+'/'))throw Error('Not a public asset');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),hashes=inputs.map(hash);
const rate=48000,frames=rate*seconds,mix=new Float32Array(frames*2);
for(const input of inputs){
 const raw=execFileSync('ffmpeg',['-v','error','-i',input,'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:128*1024*1024});
 if(raw.length!==mix.length*4)throw Error('Every input must match selected duration');
 for(let i=0;i<mix.length;i++){const value=raw.readFloatLE(i*4);if(!Number.isFinite(value))throw Error('Nonfinite source');mix[i]+=value;}
}
let peak=0;for(const value of mix){if(!Number.isFinite(value))throw Error('Nonfinite mix');peak=Math.max(peak,Math.abs(value));}
if(peak>=1)throw Error('Mix clips; refuse implicit gain changes');
if(inputs.some((p,i)=>hash(p)!==hashes[i]))throw Error('Input changed');
const wav=Buffer.alloc(44+mix.length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*8,28);wav.writeUInt16LE(8,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(mix.length*4,40);mix.forEach((v,i)=>wav.writeFloatLE(v,44+i*4));
mkdirSync(destination);const output=join(destination,'arrangement-trial.wav');writeFileSync(output,wav,{flag:'wx'});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({inputs:inputs.map((path,i)=>({path,sha256:hashes[i]})),rate,frames,seconds,peak,outputSha256:hash(output),normalizationApplied:false,approvedForGame:false,fullSongVerified:false,sunoCharacterVerified:false,scope:'Bounded offline trial sum only. Input schedule, timbre, separation, balance and repeat behavior require separate evidence.'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,inputs:inputs.length,frames,peak,approvedForGame:false}));
