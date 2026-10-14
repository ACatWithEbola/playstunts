/** Diagnostic MIDI mask. Preserve byte count/order and transport pacing;
 * silence other note attacks by changing velocity only. Not game playback. */
export function createNoteIsolation(channel:number,note?:number){
 if(!Number.isInteger(channel)||channel<0||channel>15||(note!==undefined&&(!Number.isInteger(note)||note<0||note>127)))throw Error('Invalid diagnostic note selection');
 let status=0,index=0,pitch=0,sysex=false;
 return (writes:number[][])=>writes.map(([port,byte])=>{
  if(port!==0x330)return [port,byte];
  if(byte>=0xf8)return [port,byte];
  if(byte===0xf0){sysex=true;status=0;index=0;return [port,byte];}
  if(byte===0xf7){sysex=false;return [port,byte];}
  if(sysex){
   if(!(byte&128))return [port,byte];
   // A new non-realtime status aborts an unterminated SysEx, just as the
   // synth's unit router does. Do not let subsequent note attacks leak.
   sysex=false;
  }
  if(byte&128){status=byte;index=0;return [port,byte];}
  const count=(status&0xe0)===0xc0?1:2;
  if(index===0)pitch=byte;
  const muted=(status&0xf0)===0x90&&index===1&&((status&15)!==channel||(note!==undefined&&pitch!==note));
  index=(index+1)%count;
  return [port,muted?0:byte];
 });
}
