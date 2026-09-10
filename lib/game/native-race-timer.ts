export interface NativeRaceTimerHost {
 memory():Uint8Array;stackMatches():boolean;audioSample(record:number,interval:number):void;
 pauseAudio():void;capture(forced:number):void;
}
/** Original14318..14412: guarded audio consumption and recording clock.
 * The original timer divides by five, and replay speed can capture zero,
 * one or two input ticks on a recording-clock edge. */
export function tickOriginalRaceTimer(host:NativeRaceTimerHost,d:number){
 const byte=(at:number)=>host.memory()[d+at],put=(at:number,n:number)=>{host.memory()[d+at]=n&255;};
 const view=()=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);},word=(at:number)=>view().getUint16(d+at,true),set=(at:number,n:number)=>view().setUint16(d+at,n&65535,true);
 if(!host.stackMatches()||byte(0x8936))return;
 put(0x8936,byte(0x8936)+1);
 if(byte(0x8936)===1){
  set(0x8a46,word(0x8a46)+1);
  if((word(0x8a46)<<16>>16)>=5&&word(0x9332)!==word(0x8ffc)){
   host.audioSample((0x955e+word(0x9332)*34)&65535,word(0x8a46));set(0x8a46,0);set(0x9332,word(0x9332)+1);if(word(0x9332)===40)set(0x9332,0);
  }
  if(!byte(0x8ff4)&&!byte(0xaa77)&&!(byte(0x9aca)&&byte(0xa3c2)===2)){
   if(byte(0xa3c2)===0&&(word(0x8c1e)<<16>>16)>=(word(0x8c20)<<16>>16)){put(0x9aca,1);host.pauseAudio();}
   else{
    put(0x90a0,byte(0x90a0)-1);
    if(!byte(0x90a0)){
     put(0x90a0,5);set(0xaa78,word(0xaa78)+1);
     if(byte(0xa3c2)===2&&byte(0x8ffe)===2){put(0x9b43,byte(0x9b43)-1);if(!byte(0x9b43)){host.capture(0);put(0x9b43,2);}}
     else{if(byte(0xa3c2)===2&&byte(0x8ffe)===3)host.capture(0);host.capture(0);}
    }
   }
  }
 }
 put(0x8936,byte(0x8936)-1);
}
