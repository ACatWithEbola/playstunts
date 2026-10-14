/** Scratch-only shared stereo attenuation. Never certifies note identity. */
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const [source,reference,output,regions]=process.argv.slice(2);
if(!source||!reference||!output||!regions||existsSync(output))throw Error('Provide source, reference, NEW output and start:end regions');
const intervals=regions.split(',').map(value=>value.split(':').map(Number));
if(intervals.some(pair=>pair.length!==2||!pair.every(Number.isFinite)||pair[0]<20||pair[1]<=pair[0]))throw Error('Invalid tail regions');
const rate=48000,block=2400;
const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:128*1024*1024});
const pcm=decode(source),ref=decode(reference),result=Buffer.from(pcm);
const rms=(bytes,first,last)=>{let sum=0;for(let i=first*2;i<last*2;i++){const sample=bytes.readFloatLE(i*4);sum+=sample*sample;}return Math.sqrt(sum/((last-first)*2));};
const scale=rms(pcm,2*rate,20*rate)/rms(ref,2*rate,20*rate);
if(!Number.isFinite(scale))throw Error('Nonzero baseline required');
for(const [start,end] of intervals){
 const first=Math.round(start*rate),last=Math.round(end*rate);
 if(last*8>pcm.length||last*8>ref.length)throw Error('Tail exceeds available source/reference');
 let previous=1;
 for(let at=first;at<last;at+=block){
  const stop=Math.min(last,at+block),level=rms(pcm,at,stop),target=rms(ref,at,stop)*scale;
  const gain=level>1e-12?Math.min(1,target/level):0;
  for(let frame=at;frame<stop;frame++){
   const value=previous+(gain-previous)*(frame-at+1)/(stop-at);
   for(let channel=0;channel<2;channel++)result.writeFloatLE(pcm.readFloatLE((frame*2+channel)*4)*value,(frame*2+channel)*4);
  }
  previous=gain;
 }
}
execFileSync('ffmpeg',['-v','error','-n','-f','f32le','-ar',String(rate),'-ac','2','-i','pipe:0','-c:a','pcm_f32le',output],{input:result,maxBuffer:1024*1024});
console.log(JSON.stringify({output,intervals,sharedStereoAttenuationOnly:true,notesOrAudibleSeamsVerified:false}));
