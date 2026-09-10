import {adlibOperatorControl} from './adlib-operator-control.ts';
import {adlibVolume} from './adlib-volume.ts';
/** Original2A66E, regular AdLib branch. Controller1/11/12 affect currently
 * owned voices; only sustain64 is copied into the retained timer here. */
export function applyAdlibTrackControl(timers:Uint8Array[],voices:Uint8Array[],owner:number,control:number,value:number,velocities:ReadonlyArray<number>,instrumentAt:(offset:number,segment:number)=>Uint8Array){
 const timer=timers[owner];if(!timer)throw Error('Missing original controller timer');
 control&=255;value&=65535;if(control===64)timer[0x25]=value&255;
 const writes:number[][]=[],field=({1:0x16,11:0x17,12:0x18} as Record<number,number>)[control];
 for(let index=0;index<voices.length;index++){
  const voice=voices[index];if(voice[0]!==timer[0x23])continue;
  if(index&&voice[1]&&(control===7||field!==undefined)){
   const view=new DataView(voice.buffer,voice.byteOffset,voice.byteLength),instrument=instrumentAt(view.getUint16(16,true),view.getUint16(18,true)),channel=index-1;
   if(control===7)writes.push(...adlibVolume(Array.from(instrument),channel,value&255,velocities[channel]));
   else writes.push(...adlibOperatorControl(instrument,channel,instrument[field],value));
  }
  if(control===64&&!value&&voice[1]===2)voice[22]=4;
 }
 return writes;
}
