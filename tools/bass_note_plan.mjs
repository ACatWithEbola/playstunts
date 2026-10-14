/** Diagnostic note spans. Does not model the MT-32 envelopes or audible onset. */
export function bassNotePlan(messages,frames,channel=2,retriggerPolicy='reject'){
 if(!['reject','verified-single-assign'].includes(retriggerPolicy))throw Error('Invalid retrigger policy');
 if(!Number.isSafeInteger(frames)||frames<=0)throw Error('Invalid render window');
 const active=new Map(),notes=[],controls=[],unmatchedReleases=[];let priorFrame=-Infinity;
 const release=(pitch,frame)=>{const note=active.get(pitch);if(!note){unmatchedReleases.push({pitch,frame});return;}note.releaseFrame=frame;active.delete(pitch);};
 for(const message of messages){
  if(!Number.isSafeInteger(message.frame)||message.frame<priorFrame)throw Error('Unordered note plan');priorFrame=message.frame;
  if(message.status>=0xf0||(message.status&15)!==channel)continue;
  const {frame,status,data}=message,kind=status&0xf0;
  if(!Number.isSafeInteger(frame)||frame>=frames)throw Error('Event outside supplied window');
  if(kind===0x90&&data[1]){
   if(frame<0)throw Error('Active note predates PCM origin');
   if(active.has(data[0])){
    if(retriggerPolicy!=='verified-single-assign')throw Error('Ambiguous overlapping same-pitch notes');
    const prior=active.get(data[0]);prior.retriggerAbortFrame=frame;release(data[0],frame);
   }
   const note={pitch:data[0],velocity:data[1],startFrame:frame,releaseFrame:null,windowTruncated:false};notes.push(note);active.set(data[0],note);
  }else if(kind===0x80||kind===0x90)release(data[0],frame);
  else{
   controls.push(message);
   if(kind===0xb0&&(data[0]===123||data[0]===120))for(const pitch of [...active.keys()])release(pitch,frame);
   else if(kind===0xb0&&![7,10,121].includes(data[0]))throw Error('Unsupported bass controller '+data[0]);
   else if(kind!==0xb0&&kind!==0xc0)throw Error('Unsupported bass expression message');
  }
 }
 for(const note of active.values()){note.releaseFrame=frames;note.windowTruncated=true;}
 return {notes,controls,unmatchedReleases,retriggerPolicy,releaseTailModeled:false,audibleOnsetsVerified:false};
}
