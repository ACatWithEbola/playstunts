export interface OriginalMusicFadeHost {
 memory():Uint8Array;
 musicVolume(value:number):void|Promise<void>;
 alternateCommand(command:number,data:number):void|Promise<void>;
 beginDelay(ticks:number):void;
 finishDelay():Promise<void>;
 stopMusic():void|Promise<void>;
}
/** Original 2956c..29666. Fade in steps of two, then stop the score.
 * The alternate driver's final delay and volume restore are preserved. */
export async function fadeOriginalMusic(host:OriginalMusicFadeHost,d:number,duration:number){
 const byte=(at:number)=>host.memory()[d+at],put=(at:number,n:number)=>{host.memory()[d+at]=n&255;};
 const paused=(n:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4e0c,n,true);};
 const delay=async(ticks:number)=>{host.beginDelay(ticks);await host.finishDelay();};
 const ticks=duration<<16>>16;
 if(!byte(0x4e06)){
  for(let volume=byte(0x9f62);volume>0;volume-=2){paused(1);await host.musicVolume(volume);paused(0);await delay(ticks);}
 }else{
  for(let volume=100;volume>0;volume-=2){paused(1);put(0x4e0b,volume);await host.alternateCommand(4,0x4e08);paused(0);await delay(ticks);}
 }
 await host.stopMusic();
 if(byte(0x4e06)){await delay(50);put(0x4e0b,100);await host.alternateCommand(4,0x4e08);}
}
