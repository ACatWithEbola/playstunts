/** Diagnostic MIDI decoding. Completion timestamp is not audible onset. */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function decodeDeliveredMidi(events){
 let status=0,data=[],sysex=false,last=-Infinity,awaiting=false;
 const messages=[],interruptions=[],realtime=[];
 for(const row of events){
  const [frame,port,byte]=row;
  if(!Number.isSafeInteger(frame)||frame<last||!Number.isInteger(byte)||byte<0||byte>255)throw Error('Invalid ordered MIDI trace');
  last=frame;if(port!==0x330)continue;
  if(byte>=0xf8){realtime.push({frame,status:byte});continue;}
  if(byte&128){
   if(data.length)interruptions.push({frame,status,data:[...data]});
   data=[];
   if(byte===0xf0){sysex=true;status=0;awaiting=false;continue;}
   if(byte===0xf7){sysex=false;status=0;awaiting=false;continue;}
   if(sysex){interruptions.push({frame,status:0xf0,data:[],kind:'unterminated-sysex'});sysex=false;}
   status=byte;awaiting=true;
   if(byte===0xf6){messages.push({frame,status,data:[]});status=0;awaiting=false;}
   continue;
  }
  if(sysex||!status)continue;
  const count=status<0xf0?((status&0xe0)===0xc0?1:2):status===0xf2?2:status===0xf1||status===0xf3?1:0;
  if(!count)continue;
  awaiting=true;data.push(byte);
  if(data.length===count){messages.push({frame,status,data:[...data]});data=[];awaiting=false;if(status>=0xf0)status=0;}
 }
 return {messages,interruptions,realtime,partial:sysex?{status:0xf0,data:[]}:awaiting?{status,data}:null,audibleOnsetsVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const trace=JSON.parse(readFileSync(process.argv[2],'utf8')),decoded=decodeDeliveredMidi(trace.events);
 const channel=Number(process.argv[3]??2);if(!Number.isInteger(channel)||channel<0||channel>15)throw Error('Invalid selected channel');
 const selected=decoded.messages.filter(m=>m.status<0xf0&&(m.status&15)===channel);
 console.log(JSON.stringify({sampleRate:trace.sampleRate,pcmOriginFrame:trace.pcmOriginFrame,channel,messages:selected,interruptedMessages:decoded.interruptions.length,partial:decoded.partial,audibleOnsetsVerified:false}));
}
