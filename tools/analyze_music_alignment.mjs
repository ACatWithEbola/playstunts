/** Read-only coarse attack analysis. Energy rises are NOT note identity or
 * listening proof; arrangements can have different attacks and dynamics. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function analyze(path,cue=0){
 if(!Number.isFinite(cue)||cue<0)throw Error('Invalid attack-analysis cue');
 const bytes=execFileSync('ffmpeg',['-v','error','-i',path,'-af',`atrim=start=${cue},asetpts=PTS-STARTPTS`,'-t','3','-ac','2','-ar','16000','-f','f32le','pipe:1'],{maxBuffer:1024*1024});
 const energy=[];
 // Average channel power, not the channels themselves: opposite-phase stereo
 // must not disappear into mono before attack detection.
 for(let start=0;start+1280<=bytes.length;start+=1280){
  let sum=0;for(let i=0;i<320;i++){const sample=bytes.readFloatLE(start+i*4);sum+=sample*sample;}
  energy.push(Math.sqrt(sum/320));
 }
 const rise=energy.map((value,i)=>Math.max(0,value-(energy[i-1]??0))),peak=Math.max(...rise);
 const attacks=[];
 for(let i=1;i<rise.length-1;i++)if(rise[i]>=peak*.12&&rise[i]>=rise[i-1]&&rise[i]>rise[i+1]){
  if(attacks.length&&i-attacks.at(-1).frame<5){if(rise[i]>attacks.at(-1).rise)attacks.pop();else continue;}
  attacks.push({frame:i,seconds:i*.01,rise:rise[i]});
 }
 return {path,cue,windowSeconds:.01,attacks:attacks.map(({seconds,rise})=>({seconds,relativeRise:+(rise/peak).toFixed(3)})),peakRms:Math.max(...energy)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const paths=process.argv.slice(2);if(paths.length!==2)throw Error('Provide original render and enhanced recording');
 console.log(JSON.stringify({method:'10ms stereo-power RMS positive rises, 50ms grouping; coarse attacks only, not pitch/note equivalence',original:analyze(paths[0]),enhanced:analyze(paths[1])},null,2));
}
