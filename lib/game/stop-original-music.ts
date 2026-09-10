export interface OriginalMusicStopHost {
 memory():Uint8Array;
 stopTracks(first:number,last:number):void;
 flushVoices():void;
}
/** Original 2918c, including its 29b02 call with a null score.
 * Stops music owners 0..15 while retaining the effect owners and car pool. */
export function stopOriginalMusic(host:OriginalMusicStopHost,d:number){
 const byte=(at:number,n:number)=>{host.memory()[d+at]=n&255;};
 const word=(at:number,n:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+at,n&65535,true);};
 word(0x4e0c,1);byte(0x4e04,0);
 host.stopTracks(0,15);
 const volume=host.memory()[d+0x9f62];
 for(let owner=0;owner<16;owner++){byte(0x931a+owner,0);byte(0x90e0+owner,0);}
 for(let owner=0;owner<16;owner++){
  const at=0x801e+owner*72;
  for(const [offset,value] of [[0x22,127],[0x23,owner],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,volume],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])byte(at+offset,value);
  for(const offset of [0,2,0x18,0x1a,0x1e,0x20,0x26])word(at+offset,0);
 }
 byte(0x88e2,0);host.flushVoices();word(0x4e0c,0);
}
