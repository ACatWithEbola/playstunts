/** Preserve every delivered channel event; do not infer audible envelopes. */
export function musicScoreLedger(messages,frames){
 if(!Number.isSafeInteger(frames)||frames<=0)throw Error('Invalid score window');
 const channels=Array.from({length:16},(_,channel)=>({channel,events:[],attacks:0,releases:0,controllers:0,programs:0,expression:0,startupEvents:0}));
 let previous=-Infinity;
 for(const message of messages){
  const {frame,status,data}=message;
  if(!Number.isSafeInteger(frame)||frame<previous||frame>=frames)throw Error('Invalid score event frame');previous=frame;
  if(!Number.isInteger(status)||status<0x80||status>=0xf0)throw Error('Channel event required');
  const kind=status&0xf0,count=kind===0xc0||kind===0xd0?1:2;
  if(!Array.isArray(data)||data.length!==count||data.some(value=>!Number.isInteger(value)||value<0||value>127))throw Error('Invalid score event data');
  const channel=channels[status&15];channel.events.push({frame,status,data:[...data]});
  if(frame<0){channel.startupEvents++;continue;}
  if(kind===0x90&&data[1]>0)channel.attacks++;
  else if(kind===0x80||kind===0x90)channel.releases++;
  else if(kind===0xb0)channel.controllers++;
  else if(kind===0xc0)channel.programs++;
  else channel.expression++;
 }
 return {frames,channels,releaseEnvelopesModeled:false,audibleOnsetsVerified:false};
}
