import {originalTandyPitchTable,bendOriginalTandyPitch} from './tandy-pitch.ts';
import {originalTandyToneWrites,originalTandyVolumeWrites} from './tandy-control.ts';
import {updateMs91TandyVoice} from './ms91-tandy-voice-update.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface OriginalTandyBiosSound {ax:number;es:number;bx:number;cx:number;dx:number}
/** TD15:07E5..0A05. BIOS sound calls are returned to the native DAC host. */
export function updateOriginalTandyVoice(driver:Uint8Array,driverSegment:number,channel:number,voice:Uint8Array,timer:Uint8Array,instrument:Uint8Array,incomingCx:number,port61:number,generation?:PhysicsEngineVersion){
 const program=runOriginalTandyVoiceUpdate(driver,driverSegment,channel,voice,timer,instrument,incomingCx,port61,generation);let step=program.next();while(!step.done)step=program.next();return step.value;
}
/** Opt-in CPU boundary at each legacy BIOS call. Resumed driver state comes
 * from explicitly delivered interrupts, never a guessed completion delay. */
export function* runOriginalTandyVoiceUpdate(driver:Uint8Array,driverSegment:number,channel:number,voice:Uint8Array,timer:Uint8Array,instrument:Uint8Array,incomingCx:number,port61:number,generation?:PhysicsEngineVersion,deferBios=false):Generator<{driver:Uint8Array;writes:number[][];bios:OriginalTandyBiosSound[]},{writes:number[][];bios:OriginalTandyBiosSound[];cx:number},Uint8Array|undefined>{
 if(generation==='ms-1991')return {...updateMs91TandyVoice(driver,channel,voice,timer,instrument,incomingCx,port61),bios:[] as OriginalTandyBiosSound[]};
 const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];let cx=incomingCx&65535;if(!voice[1])return {writes,bios,cx};
 const word=(bytes:Uint8Array,at:number)=>bytes[at]|bytes[at+1]<<8,put=(bytes:Uint8Array,at:number,value:number)=>{bytes[at]=value&255;bytes[at+1]=(value>>>8)&255;};
 const table=originalTandyPitchTable(channel,incomingCx),modulated=instrument[0x35]===1,note=(voice[3]+(modulated?voice[0x22]:0))&255;driver[0x4ff]=note;
 let frequency=modulated?word(driver,table+note*2):word(voice,4);frequency=(frequency-(instrument[0x11]<<24>>24))&65535;
 frequency=bendOriginalTandyPitch(driver,table,note,frequency,word(timer,0x26),instrument[0x12]);
 if(instrument[0x28]===2)frequency=(frequency+word(voice,0x1c))&65535;
 if(instrument[0x19]===2){frequency=(frequency+word(voice,0x14))&65535;put(voice,6,frequency);}
 let volume=driver[0x13f+driver[0x3f+(((driver[0x516+channel]<<4)&255)|driver[0x510+channel])]];
 if(instrument[0x19]===3)volume=driver[0x13f+driver[0x3f+(((volume<<4)&255)|voice[0x15])]];
 cx=frequency;
 if(channel>=1&&channel<=4)writes.push(...originalTandyVolumeWrites(driver,channel,volume),...originalTandyToneWrites(driver,channel,frequency));
 else if(channel===0){
  cx=frequency&0xfff;put(driver,0x50c,frequency);driver[0x50e]=volume>>>1;
  writes.push([0xc6,frequency&255],[0xc7,((volume<<4)&0xe0)|((frequency&0xfff)>>>8)]);
  if(driver[0x504]===2){
   driver[0x504]=1;cx=word(driver,0x50a);
   // Original saves playback registers before the silent BIOS call, then
   // restores DX/CX/BX/AX/ES/flags before the second INT1A. A completion may
   // mutate retained driver memory but must not replace those saved registers.
   const playback={ax:0x8300|driver[0x50e],es:word(driver,0x508),bx:word(driver,0x506),cx:word(driver,0x50a),dx:word(driver,0x50c)};
   const silent={ax:0x8300,es:driverSegment,bx:0x50f,cx:1,dx:1};bios.push(silent);
   const resume=(next:Uint8Array|undefined)=>{if(next){if(next.length!==driver.length)throw Error('Invalid resumed legacy Tandy driver');driver.set(next);}};
   if(deferBios)resume(yield {driver,writes:writes.map(write=>write.slice()),bios:[{...silent}]});
   bios.push(playback);
   if(deferBios)resume(yield {driver,writes:[],bios:[{...playback}]});
  }
 }else writes.push([0x42,frequency&255],[0x42,frequency>>>8],[0x61,(port61|3)&255]);
 return {writes,bios,cx};
}
