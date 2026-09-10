import {adlibReset} from './adlib-release.ts';
/** Original2B4D8 for one regular AdLib owner, including inactive records. */
export function stopAdlibTrack(timers:Uint8Array[],voices:Uint8Array[],owner:number){
 const writes:number[][]=[];
 for(let i=0;i<voices.length;i++){
  const voice=voices[i];if(voice[0]!==owner)continue;
  if(!i)throw Error('Original sample-channel track stop is not yet integrated');
  writes.push(...adlibReset(i-1));
  voice[0]=255;voice[1]=0;voice[2]=0;
  new DataView(voice.buffer,voice.byteOffset,voice.byteLength).setUint32(16,0,true);
 }
 timers[owner][0x15]=0;return writes;
}
/** Original DA branch additionally invokes29B02 with a null sequence. */
export function resetAdlibTrack(timers:Uint8Array[],voices:Uint8Array[],lastNotes:Uint8Array,markers:Uint8Array,owner:number,master:number){
 const writes=stopAdlibTrack(timers,voices,owner),timer=timers[owner],v=new DataView(timer.buffer,timer.byteOffset,timer.byteLength);
 for(const [at,value] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,master],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[at]=value;
 for(const at of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(at,0,true);
 lastNotes[owner]=0;markers[owner]=0;return writes;
}
