export interface OriginalPcSpeakerTick {writes:number[][];}
/** PC15:05D5..0682 selects one of four logical notes for the single speaker.
 * Volumes gate voices; the retained phase alternates the two priority groups. */
export function stepOriginalPcSpeakerOutput(driver:Uint8Array,port61:number):OriginalPcSpeakerTick {
 driver[0x1bc]=driver[0x1a8];for(let i=4;i>=1;i--)driver[0x1bc+i]=driver[0x1b7+i]?driver[0x1a8+i]:0;
 const writes:number[][]=[];
 if(!driver[0x1bc]){
  let first=driver[0x1bf],second=driver[0x1c0],selected=0;
  if(first||second){
   if(driver[0x1c1]&2){first=driver[0x1bd];second=driver[0x1be];if(first||second)selected=first?1:2;else selected=driver[0x1bf]?3:4;}
   else selected=first?3:4;
  }else selected=driver[0x1bd]?1:driver[0x1be]?2:0;
  if(selected){const at=0x1ad+selected*2;writes.push([0x42,driver[at]],[0x42,driver[at+1]],[0x61,(port61|3)&255]);}
  else writes.push([0x61,port61&254]);
 }
 driver[0x1c1]=(driver[0x1c1]+1)&255;return {writes};
}
/** PC15:053E..05D4 performs the original unsigned product and13-bit scale.
 * Signed bend direction and the positive4096 threshold are intentionally asymmetric. */
export function originalPcSpeakerPitch(driver:Uint8Array,note:number,bend:number,range:number){
 const at=0x3f+(note&255)*2;return bendOriginalPcSpeakerPitch(driver,note,driver[at]|driver[at+1]<<8,bend,range);
}
function bendOriginalPcSpeakerPitch(driver:Uint8Array,note:number,frequency:number,bend:number,range:number){
 const word=(at:number)=>driver[at]|driver[at+1]<<8;bend=bend<<16>>16;
 if(bend>0){const target=word(0x3f+((note+range)&255)*2),delta=(frequency-target)&65535,factor=(bend+(bend>=4096?128:0))&65535;frequency-=Math.floor(delta*factor/8192)&65535;}
 else if(bend<0){const target=word(0x3f+((note-range)&255)*2),delta=(target-frequency)&65535;frequency+=Math.floor(delta*((-bend)&65535)/8192)&65535;}
 return frequency&65535;
}

/** PC15:0419..052C updates a voice divisor from its patch, bend and envelopes. */
export function updateOriginalPcSpeakerVoice(driver:Uint8Array,channel:number,voice:Uint8Array,timer:Uint8Array,instrument:Uint8Array){
 if(!voice[1])return;
 const word=(bytes:Uint8Array,at:number)=>bytes[at]|bytes[at+1]<<8,put=(bytes:Uint8Array,at:number,value:number)=>{bytes[at]=value&255;bytes[at+1]=(value>>8)&255;};
 const note=(voice[3]+(instrument[0x35]===1?voice[0x22]:0))&255;driver[0x1a7]=note;
 let frequency=instrument[0x35]===1?word(driver,0x3f+note*2):word(voice,4);
 frequency=(frequency-(instrument[0x11]<<24>>24))&65535;
 frequency=bendOriginalPcSpeakerPitch(driver,note,frequency,word(timer,0x26),instrument[0x12]);
 if(instrument[0x28]===2)frequency=(frequency+word(voice,0x1c))&65535;
 if(instrument[0x19]===2)frequency=(frequency+word(voice,0x14))&65535;
 put(driver,0x1ad+channel*2,frequency);put(voice,6,frequency);
}
