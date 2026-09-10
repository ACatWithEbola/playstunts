export type OriginalMt32Control='note'|'release'|'volume'|'controller'|'bend'|'frequency'|'stop'|'instrument'|'update'|'silence'|'reset-controllers'|'noop';

/** Supplied MT15 callbacks 03F8..0666. Produces the original MPU data bytes,
 * including unmasked high-bit values and channel quirks. MPU readiness and
 * Roland synthesis belong to separate layers; this is not browser MIDI I/O. */
export function applyOriginalMt32DriverControl(kind:OriginalMt32Control,channel:number,voice:Uint8Array,patch:Uint8Array,value=0,extra=0){
 if(voice.length!==46||patch.length<100)throw Error('Incomplete MT15 voice or instrument');
 const writes:number[][]=[];
 const emit=(...bytes:number[])=>{for(const byte of bytes)writes.push([0x330,byte&255]);};
 const status=(base:number)=>base|(channel&255);
 const bend=(amount:number)=>{const word=amount&65535;emit(status(0xe0),word&127,(word>>>7)&127);};
 const word=(at:number)=>voice[at]|voice[at+1]<<8;
 switch(kind){
  case 'note':
   voice[3]=voice[6]=value&255;voice[4]=patch[21]===0?127:extra&255;
   emit(status(0x90),value,voice[4]);break;
  case 'release':emit(status(0x80),voice[6],0);break;
  case 'volume':emit(0xb0|(channel&15),7,value);break;
  case 'controller':emit(status(0xb0),value,extra);break;
  case 'bend':bend(value+0x2000);break;
  case 'frequency':bend(value*60);break;
  case 'stop':emit(status(0xb0),123,0);break;
  case 'instrument':
   emit(status(0xc0),patch[68]);
   emit(status(0xb0),100,0,status(0xb0),101,0,status(0xb0),6,patch[18]);
   if(patch[69])emit(status(0xb0),7,patch[69]);
   emit(status(0xb0),10,patch[70]);break;
  case 'update':
   if(patch[53]===1){
    const note=(voice[34]+voice[3])&255;
    if(note!==voice[6]){emit(status(0x80),voice[6],0);voice[6]=note;emit(status(0x90),note,voice[4]);}
   }
   // Both modulation paths may emit, in this order. There is no active-voice
   // check here: that responsibility belongs to the calling game routine.
   if(patch[40]===4)emit(status(0xb0),1,word(28));
   else if(patch[40]===2)emit(status(0xe0),0,word(28));
   if(patch[25]===4)emit(status(0xb0),1,word(20));
   else if(patch[25]===2)emit(status(0xe0),0,word(20));
   break;
  case 'silence':
   // 041E uses signed JG after decrement: MIDI channel zero is omitted.
   for(let index=15;index>0;index--)emit(0xb0|index,123,0,0xb0|index,121,0);
   break;
  case 'reset-controllers':
   for(let index=15;index>=0;index--)emit(0xb0|index,121,0);
   break;
  case 'noop':break;
 }
 return {writes};
}
