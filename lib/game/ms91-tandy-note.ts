/** Original TD15 MS1991:0669. Sample-start requests are returned to the owner,
 * which commits driver/voice state before scheduling playback/stop completion.
 */
export function startMs91TandyNote(driver:Uint8Array,channel:number,voice:Uint8Array,instrument:Uint8Array,note:number,velocity:number,incomingCx:number,incomingDx:number){
 if(driver.length!==3241||voice.length<46||instrument.length<0x16)throw Error('Incomplete modern Tandy note state');
 const word=(bytes:Uint8Array,at:number)=>bytes[at]|bytes[at+1]<<8,put=(at:number,n:number)=>{voice[at]=n&255;voice[at+1]=(n>>>8)&255;};
 voice[3]=note&255;let cx=incomingCx&65535,dx=incomingDx&65535;
 if(voice[3]!==255){
  cx=channel&65535;
  const table=cx<1?0x497:cx<=3?0x3a7:cx===4?0x557:0x23f,index=cx===4?(voice[3]*2)&15:voice[3]*2;
  dx=word(driver,table+index);put(4,dx);put(6,dx);
 }
 const scaled=((instrument[0x15]?velocity:127)&255)>>>3;
 driver[(0x5a9+cx)&65535]=driver[0x567+scaled];
 if(cx!==0||instrument[0xa]===0)return;
 // The modern channel-zero sample path replaces pitch with its playback-rate
 // lookup and ignores incoming DX. The rate table is not a PSG divisor table.
 const frequency=word(driver,0x32f+voice[3]*2);put(4,frequency);put(6,frequency);
 return {channel:0,offset:word(instrument,6),segment:word(instrument,8),frequency,repeats:instrument[5]===6?0:1};
}
