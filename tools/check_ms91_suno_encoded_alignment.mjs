/** Compare web encodes with their approved timing-edited source. Not listening QA. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,isAbsolute} from 'node:path';
import {ms91SunoMusic} from '../lib/game/ms91-suno-music.ts';
const build=process.argv[2];assert.ok(build&&isAbsolute(build),'Supply actual-Suno build directory');
const profile=ms91SunoMusic('ms-1991');
const root=new URL('../public'+profile.paths.titl.replace(/[^/]+$/,''),import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('provenance.json',root)));
const decode=(path,frames)=>{
 const bytes=execFileSync('ffmpeg',['-v','error','-i',path,'-af',`atrim=end_sample=${frames}`,'-ar','48000','-ac','2','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
 return new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
};
for(const file of manifest.files){
 const source=join(build,file.score==='titl'?'title-loop/loop-seam-trial.wav':file.score+'-three-cycle.wav');
 assert.equal(createHash('sha256').update(readFileSync(source)).digest('hex'),file.sourceSha256);
 const reference=decode(source,file.decodedFrames),encoded=decode(new URL(file.file,root).pathname,file.decodedFrames);
 assert.equal(encoded.length,reference.length);
 const results=[];
 for(const seconds of [.25,file.timing.introDuration-.25,file.timing.introDuration+.25,file.timing.introDuration+file.timing.loopDuration-.25]){
  const start=Math.round(seconds*48000),frames=4800;let best={lag:0,correlation:-1},zero=0;
  let referenceEnergy=0,encodedEnergy=0;
  for(let i=start*2;i<(start+frames)*2;i++){referenceEnergy+=reference[i]**2;encodedEnergy+=encoded[i]**2;}
  if(referenceEnergy===0){
   const encodedRms=Math.sqrt(encodedEnergy/(frames*2));assert.ok(encodedRms<1e-7,'Intentional rest must remain silent');
   results.push({seconds,intentionalSilence:true,encodedRms,alignmentMeasurable:false});continue;
  }
  for(let lag=-96;lag<=96;lag++){
   let dot=0,a2=0,b2=0;
   for(let i=0;i<frames;i++)for(let channel=0;channel<2;channel++){
    const a=reference[(start+i)*2+channel],b=encoded[(start+i+lag)*2+channel];dot+=a*b;a2+=a*a;b2+=b*b;
   }
   const correlation=dot/Math.sqrt(a2*b2);
   if(lag===0)zero=correlation;if(correlation>best.correlation)best={lag,correlation};
  }
  // High waveform similarity plus no measurable sample displacement at four
  // separated positions catches encoder-delay/drift errors, not musical fidelity.
  assert.ok(zero>.95,`${file.score}/${seconds}: weak zero-lag similarity ${zero}`);
  assert.equal(best.lag,0,`${file.score}/${seconds}: encoded sample displacement`);
  results.push({seconds,zeroLagCorrelation:zero,bestLagFrames:best.lag});
 }
 const startFrame=Math.round(file.timing.introDuration*48000),endFrame=Math.round((file.timing.introDuration+file.timing.loopDuration)*48000);
 const seam=[];
 for(let channel=0;channel<2;channel++){
  const sourceJump=reference[startFrame*2+channel]-reference[(endFrame-1)*2+channel];
  const encodedJump=encoded[startFrame*2+channel]-encoded[(endFrame-1)*2+channel];
  const encodingDifference=Math.abs(encodedJump-sourceJump);
  assert.ok(encodingDifference<.02,`${file.score}: compression changed seam amplitude: source=${sourceJump}, encoded=${encodedJump}, difference=${encodingDifference}`);
  seam.push({channel,sourceJump,encodedJump,encodingDifference});
 }
 console.log(JSON.stringify({score:file.score,results,seam,scope:'Sample-rounded seam comparison; not browser-resampled or listening proof'}));
}
