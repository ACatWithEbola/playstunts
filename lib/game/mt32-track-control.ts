/** Original2A66E alternate path sends one controller on the timer's MIDI
 * channel, then applies the common owned-voice sustain-release transition. */
export function applyOriginalMt32TrackControl(timers:Uint8Array[],voices:Uint8Array[],owner:number,control:number,value:number){
 const timer=timers[owner];control&=255;value&=65535;
 if(control===64){
  timer[0x25]=value&255;
  if(!value)for(const voice of voices)if(voice[0]===timer[0x23]&&voice[1]===2)voice[22]=4;
 }
 return {writes:[[0x330,0xb0|timer[0x47]],[0x330,control],[0x330,value&255]]};
}

/** Original2B4D8 alternate path walks owners, not hardware records. A timer
 * channel >=16 skips both MIDI output and its voice cleanup, but the final
 * owner-count reset still runs for every owner in the requested range. */
export function stopOriginalMt32Track(timers:Uint8Array[],voices:Uint8Array[],owner:number,lastOwner=owner){
 const writes:number[][]=[];
 for(let index=owner;index<=lastOwner;index++){
  const channel=timers[index][0x47];if(channel>=16)continue;
  writes.push([0x330,0xb0|channel],[0x330,123],[0x330,0]);
  for(const voice of voices){
   if(voice[0]!==index)continue;
   voice[0]=255;voice[1]=voice[2]=0;voice.fill(0,16,20);
  }
 }
 for(let index=owner;index<=lastOwner;index++)timers[index][0x15]=0;
 return {writes};
}
