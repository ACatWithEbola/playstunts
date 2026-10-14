/** Offline audition only. Exact oscillator pitch, provisional envelopes. */
export function renderHarmonicBass(notes,coefficients,sourceRate,rate,frames,pitchBends=[],nyquistPolicy='reject',sourceEnvelope=[]){
 if(!['reject','truncate'].includes(nyquistPolicy))throw Error('Invalid Nyquist policy');
 if(![sourceRate,rate,frames].every(Number.isSafeInteger)||sourceRate<8000||rate<8000||rate>192000||frames<=0||frames>rate*600)throw Error('Invalid bounded audio layout');
 if(coefficients.length<3||coefficients.length>65||coefficients.length%2!==1||coefficients.some(row=>row.length!==2||row.some(v=>!Number.isFinite(v))))throw Error('Invalid stereo harmonic template');
 if(!Array.isArray(sourceEnvelope)||sourceEnvelope.length>128||sourceEnvelope.some((point,i)=>!Number.isFinite(point.seconds)||point.seconds<0||point.seconds>.6||!Number.isFinite(point.gain)||point.gain<0||point.gain>1||(i===0?point.seconds!==0:point.seconds<=sourceEnvelope[i-1].seconds))||(sourceEnvelope.length>0&&sourceEnvelope.length<2))throw Error('Invalid source envelope');
 const envelopePoints=sourceEnvelope.map(point=>({...point}));
 const harmonics=(coefficients.length-1)/2;
 let previous=-1;
 for(const bend of pitchBends){if(!Number.isSafeInteger(bend.frame)||bend.frame<0||bend.frame<previous||bend.frame>=frames*sourceRate/rate||!Number.isInteger(bend.units)||Math.abs(bend.units)>8196)throw Error('Invalid explicit pitch bend');previous=bend.frame;}
 const bends=pitchBends.map(bend=>({frame:Math.round(bend.frame*rate/sourceRate),units:bend.units}));
 const pcm=new Float32Array(frames*2),events=[];
 for(const note of notes){
  if(!Number.isInteger(note.pitch)||note.pitch<0||note.pitch>127||!Number.isInteger(note.velocity)||note.velocity<0||note.velocity>127||!Number.isSafeInteger(note.startFrame)||!Number.isSafeInteger(note.releaseFrame)||note.startFrame<0||note.releaseFrame<note.startFrame||note.releaseFrame>frames*sourceRate/rate)throw Error('Invalid note span');
  if(note.retriggerAbortFrame!==undefined&&note.retriggerAbortFrame!==note.releaseFrame)throw Error('Invalid retrigger abort');
  if(note.amplitudeModel&&(!Number.isFinite(note.amplitudeModel.decaySeconds)||note.amplitudeModel.decaySeconds<=0||note.amplitudeModel.decaySeconds>60||!Number.isFinite(note.amplitudeModel.sustainGain)||note.amplitudeModel.sustainGain<0||note.amplitudeModel.sustainGain>1))throw Error('Invalid explicit amplitude model');
  const start=Math.round(note.startFrame*rate/sourceRate),release=Math.round(note.releaseFrame*rate/sourceRate);
  const tail=Math.round(rate*(note.retriggerAbortFrame===undefined?.02:.002));
  const frequency=440*2**((note.pitch-69)/12);
  const maximumFrequency=frequency*Math.max(1,...bends.map(bend=>2**(bend.units/4096)));
  const usedHarmonics=Math.min(harmonics,Math.ceil((rate/2)/maximumFrequency)-1);
  if(usedHarmonics<1)throw Error('Fundamental exceeds Nyquist');
  if(usedHarmonics<harmonics&&nyquistPolicy==='reject')throw Error('Template harmonics exceed Nyquist');
  events.push({...note,outputStartFrame:start,outputReleaseFrame:release,frequencyHz:frequency,tailFrames:tail,...(nyquistPolicy==='truncate'?{usedHarmonics,omittedUpperHarmonics:harmonics-usedHarmonics}:{} )});
  let bendIndex=0,bendUnits=0,phaseIntegral=0,envelopeIndex=0;
  for(let at=start;at<Math.min(frames,release+tail);at++){
   while(bendIndex<bends.length&&bends[bendIndex].frame<=at)bendUnits=bends[bendIndex++].units;
   const elapsed=(at-start)/rate;
   let attack=Math.min(1,(at-start)/(rate*.005));
   if(envelopePoints.length){
    while(envelopeIndex+1<envelopePoints.length&&envelopePoints[envelopeIndex+1].seconds<=elapsed)envelopeIndex++;
    const left=envelopePoints[envelopeIndex],right=envelopePoints[envelopeIndex+1];
    attack=right?left.gain+(right.gain-left.gain)*(elapsed-left.seconds)/(right.seconds-left.seconds):left.gain;
   }
   const decay=at<release?1:Math.max(0,1-(at-release)/tail);
   const endFade=note.windowTruncated?Math.min(1,(frames-at)/(rate*.01)):1;
   const instrumentGain=note.amplitudeModel?Math.max(note.amplitudeModel.sustainGain,Math.exp(-elapsed/note.amplitudeModel.decaySeconds)):1;
   const envelope=attack*decay*endFade*note.velocity/127*instrumentGain;
   for(let harmonic=1;harmonic<=usedHarmonics;harmonic++){
    const phase=bends.length?harmonic*phaseIntegral:2*Math.PI*frequency*harmonic*elapsed;
    for(let channel=0;channel<2;channel++)pcm[at*2+channel]+=envelope*(coefficients[2*harmonic-1][channel]*Math.sin(phase)+coefficients[2*harmonic][channel]*Math.cos(phase));
   }
   if(bends.length)phaseIntegral+=2*Math.PI*frequency*2**(bendUnits/4096)/rate;
  }
 }
 if(pcm.some(v=>!Number.isFinite(v)||Math.abs(v)>=1))throw Error('Nonfinite/clipped audition');
 return {pcm,events,envelopesVerified:false,...(envelopePoints.length?{sourceEnvelope:envelopePoints,sourceEnvelopeEndPolicy:'hold-last'}:{})};
}
