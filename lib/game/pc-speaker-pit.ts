/** Channel2 subset used by PC15: mode3 tones and mode1 sample pulses.
 * Timing follows Intel8254 mode definitions (1989 datasheet, pp11–14):
 * https://www.cs.usfca.edu/~cruse/cs210s07/8254.pdf
 * Hardware behaviour, not executable code; other modes are intentionally absent. */
export function createOriginalPcSpeakerPit(){
 let mode=3,count=65536,remaining=0,gate=false,enabled=false,output=true,armed=false,running=false,pending=false,low:number|undefined;
 return {
  get output(){return enabled&&output;},
  write(port:number,value:number){
   value&=255;
   if(port===0x43){if((value>>6)!==2)return;const selected=(value>>1)&7;if((value&0x31)!==0x30||(selected!==1&&selected!==3))throw Error('Unreconstructed PC speaker PIT command');mode=selected;output=true;armed=false;running=false;pending=false;low=undefined;}
   else if(port===0x42){if(low===undefined){low=value;return;}count=(low|(value<<8))||65536;low=undefined;armed=true;if(mode===3&&!running)pending=true;}
   else if(port===0x61){const next=!!(value&1);enabled=!!(value&2);if(next&&!gate&&armed)pending=true;if(!next&&mode===3){running=false;output=true;}gate=next;}
  },
  clock(){
   if(pending){pending=false;remaining=mode===3?Math.ceil(count/2):count;output=mode===3;running=mode===1||gate;}
   else if(running&&--remaining<=0){if(mode===1){output=true;running=false;}else{output=!output;remaining=output?Math.ceil(count/2):Math.floor(count/2);}}
   return enabled&&output;
  }
 };
}
