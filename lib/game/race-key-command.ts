import {requestOriginalRaceReplay} from './request-race-replay.ts';
export interface OriginalRaceKeyServices {selectMouse():void;resetMouse(mode:number):void;initialize(mode:number):void}
/** Supplied14188..142b2. Raw flag addresses retain their original meaning;
 * notably only lowercase t toggles the opponent view, and R is a flag toggle
 * rather than a race reset. Unrecognized keys skip the transporter only. */
export function originalRaceKeyCommand(memory:Uint8Array,d:number,key:number,host:OriginalRaceKeyServices){
 key&=65535;
 if(key===27){if(memory[d+0xa3c2]===0)requestOriginalRaceReplay(memory,d);memory[d+0x8ff4]=1;}
 else if(key===68||key===100)memory[d+0x8002]^=1;
 else if(key===72||key===104)memory[d+0x12e]^=1;
 else if(key===77||key===109){host.selectMouse();host.resetMouse(memory[d+0x12c]<<24>>24);}
 else if(key===82||key===114)memory[d+0xa77f]^=1;
 else if(key===67||key===99){if(memory[d+0xa3c2]!==1){memory[d+0x12f]=(memory[d+0x12f]+1)&255;if(memory[d+0x12f]===4)memory[d+0x12f]=0;}}
 else if(key===116){if(memory[d+0x8fc8])memory[d+0xa9f0]^=1;}
 else if(key>=0x3b00&&key<=0x3e00&&(key&255)===0)memory[d+0x12f]=(key>>>8)-0x3b;
 else {if(memory[d+0xa3c2]!==1)return 0;memory[d+0xa3c2]=0;memory[d+0x7fee]=0;host.initialize(-1);}
 return 1;
}
