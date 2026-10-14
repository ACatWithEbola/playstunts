/** Read-only coarse pitch-class alignment. Harmonics/arrangement differences
 * can create ambiguous matches; this never certifies individual note identity. */
import {execFileSync} from 'node:child_process';
const [original,enhanced]=process.argv.slice(2);
if(!original||!enhanced)throw Error('Provide original WAV and enhanced recording');
const rate=11025,size=2048,hop=256,step=hop/rate;
const pitchSensitive=process.argv.includes('--pitch-sensitive'),dimensions=pitchSensitive?61:12;
const voicedOnly=process.argv.includes('--voiced-only');
const stereoPower=process.argv.includes('--stereo-power'),channels=stereoPower?2:1;
const startsArgument=process.argv.find(value=>value.startsWith('--starts='));
const starts=startsArgument?startsArgument.slice(9).split(',').map(Number):[2,12,22,32,42];
const windowArgument=process.argv.find(value=>value.startsWith('--window='));
const windowSeconds=windowArgument?Number(windowArgument.slice(9)):8;
const durationArgument=process.argv.find(value=>value.startsWith('--duration='));
const durationSeconds=durationArgument?Number(durationArgument.slice(11)):60;
if(!Number.isFinite(durationSeconds)||durationSeconds<1||durationSeconds>600||!starts.length||starts.some(value=>!Number.isFinite(value)||value<0||value+windowSeconds>durationSeconds)||!Number.isFinite(windowSeconds)||windowSeconds<1||windowSeconds>10)throw Error('Invalid comparison windows');
function fft(real,imag){
 for(let i=1,j=0;i<size;i++){
  let bit=size>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
  if(i<j){[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}
 }
 for(let width=2;width<=size;width*=2){
  const angle=-2*Math.PI/width,wr=Math.cos(angle),wi=Math.sin(angle);
  for(let start=0;start<size;start+=width){let ar=1,ai=0;
   for(let j=0;j<width/2;j++){
    const a=start+j,b=a+width/2,tr=ar*real[b]-ai*imag[b],ti=ar*imag[b]+ai*real[b];
    real[b]=real[a]-tr;imag[b]=imag[a]-ti;real[a]+=tr;imag[a]+=ti;
    [ar,ai]=[ar*wr-ai*wi,ar*wi+ai*wr];
   }
  }
 }
}
function chroma(path){
 const bytes=execFileSync('ffmpeg',['-v','error','-i',path,'-t',String(durationSeconds),'-ac',String(channels),'-ar',String(rate),'-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
 const samples=bytes.length/(4*channels),frames=[];
 for(let at=0;at+size<=samples;at+=hop){
  const values=new Float64Array(dimensions),power=new Float64Array(size/2);
  let energy=0;
  for(let channel=0;channel<channels;channel++){
   const real=new Float64Array(size),imag=new Float64Array(size);
   for(let i=0;i<size;i++){const sample=bytes.readFloatLE(((at+i)*channels+channel)*4);energy+=sample*sample;real[i]=sample*(.5-.5*Math.cos(2*Math.PI*i/(size-1)));}
   fft(real,imag);
   for(let bin=1;bin<size/2;bin++)power[bin]+=(real[bin]**2+imag[bin]**2)/channels;
  }
  for(let bin=1;bin<size/2;bin++){
   const midi=69+12*Math.log2(bin*rate/size/440);if(midi<36||midi>96)continue;
   const nearest=Math.round(midi),distance=Math.abs(midi-nearest);if(distance>.35)continue;
   const feature=pitchSensitive?nearest-36:((nearest%12)+12)%12;
   values[feature]+=Math.sqrt(Math.sqrt(power[bin]))*(1-distance/.35);
  }
  // Do not normalize sub-60dB reverb/noise into full-strength pitch evidence.
  // Matching quiet frames are continuity evidence only, not note identity.
  const norm=Math.hypot(...values),audible=Math.sqrt(energy/(size*channels))>.001;
  frames.push(Array.from(values,value=>audible&&norm>1e-12?value/norm:0));
 }
 return frames;
}
const left=chroma(original),right=chroma(enhanced),rows=[];
for(const start of starts){
 const first=Math.round(start/step),last=Math.min(left.length,Math.round((start+windowSeconds)/step));
 const voicedOriginalFrames=left.slice(first,last).filter(frame=>frame.some(value=>value!==0)).length;
 const expectedFrames=voicedOnly?voicedOriginalFrames:last-first;
 const candidates=[];
 for(let shift=-Math.round(2/step);shift<=Math.round(2/step);shift++){
  let score=0,count=0;
  for(let frame=first;frame<last;frame++){if(voicedOnly&&left[frame].every(value=>value===0))continue;const other=right[frame+shift];if(!other)continue;let dot=0;for(let pitch=0;pitch<dimensions;pitch++)dot+=left[frame][pitch]*other[pitch];if(!voicedOnly&&left[frame].every(value=>value===0)&&other.every(value=>value===0))dot=1;score+=dot;count++;}
  if(count===expectedFrames&&count&&( !voicedOnly||voicedOriginalFrames>=8))candidates.push({enhancedMinusOriginalSeconds:shift*step,similarity:score/count});
 }
 candidates.sort((a,b)=>b.similarity-a.similarity);
 const searchBoundaryHit=!!candidates[0]&&Math.abs(candidates[0].enhancedMinusOriginalSeconds)>=2-step;
 const alternative=candidates.find(candidate=>Math.abs(candidate.enhancedMinusOriginalSeconds-candidates[0].enhancedMinusOriginalSeconds)>.25);
 rows.push({originalStartSeconds:start,windowSeconds,voicedOriginalFrames,searchBoundaryHit,nonlocalPeakMargin:alternative?candidates[0].similarity-alternative.similarity:null,best:candidates.slice(0,3)});
}
// Repeated harmonies may produce almost tied, nonlocal peaks. Do not feed
// those observations into a correction fit merely because one won by rounding.
const minimumPeakMargin=.005;
for(const row of rows)row.fitExcludedReason=voicedOnly&&row.voicedOriginalFrames<8?'insufficient-voiced-evidence':!row.best.length?'no-complete-window':row.searchBoundaryHit?'search-boundary':row.nonlocalPeakMargin===null||row.nonlocalPeakMargin<minimumPeakMargin?'ambiguous-nonlocal-peak':null;
const points=rows.filter(row=>row.fitExcludedReason===null).map(row=>({x:row.originalStartSeconds+windowSeconds/2,y:row.best[0].enhancedMinusOriginalSeconds}));
const meanX=points.reduce((sum,p)=>sum+p.x,0)/points.length,meanY=points.reduce((sum,p)=>sum+p.y,0)/points.length;
const slope=points.reduce((sum,p)=>sum+(p.x-meanX)*(p.y-meanY),0)/points.reduce((sum,p)=>sum+(p.x-meanX)**2,0),intercept=meanY-slope*meanX;
const fit=points.length>=2?{provisionalSourceSecondsPerOriginalSecond:1+slope,provisionalSourceCueSeconds:intercept,maxResidualSeconds:Math.max(...points.map(p=>Math.abs(p.y-(intercept+slope*p.x)))),recordingCalibrationVerified:false}:null;
console.log(JSON.stringify({original,enhanced,voicedOnly,stereoPower,features:pitchSensitive?'61 octave-sensitive MIDI pitch bins':'12 pitch classes',frameSeconds:step,fftWindowSeconds:size/rate,minimumPeakMargin,measuredWindowsFitConsistent:!!fit&&points.length===rows.length&&fit.maxResidualSeconds<=2*step,wholeSongAlignmentVerified:false,rows:process.argv.includes('--compact')?rows.map(row=>({originalStartSeconds:row.originalStartSeconds,voicedOriginalFrames:row.voicedOriginalFrames,searchBoundaryHit:row.searchBoundaryHit,fitExcludedReason:row.fitExcludedReason,nonlocalPeakMargin:row.nonlocalPeakMargin,...row.best[0]})):rows,fit,method:'Normalized harmonic-sensitive spectral similarity; positive shift means enhanced event occurs later',individualNotesOrCalibrationVerified:false},null,process.argv.includes('--compact')?undefined:2));
