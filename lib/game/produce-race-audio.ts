import {buildViewAudioSample,type AudioListenerView} from './view-audio-sample.ts';
import {drivingAudioExit} from './driving-audio-exit.ts';
import {updateDrivingSoundFlags,type DrivingSoundRequest} from './driving-sound-flags.ts';
import type {Vector} from '../physics/math.ts';
export type RaceAudioRequest={kind:DrivingSoundRequest|'reset';handle?:number};
/** Original a670..aa91 producer. Driver calls are returned in execution order;
 * this does not synthesize audio or run the independent interrupt clock.
 */
export function produceRaceAudio(before:Uint8Array,dataSegment:number){
 const memory=before.slice();
 return {memory,...produceRaceAudioInPlace(memory,dataSegment)};
}
/** Identical producer for a memory image the caller already owns. */
export function produceRaceAudioInPlace(memory:Uint8Array,dataSegment:number){
 if(!Number.isInteger(dataSegment)||dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),d=dataSegment;
 const byte=(off:number)=>memory[d+off],word=(off:number)=>v.getUint16(d+off,true);
 const requests:RaceAudioRequest[]=[];
 const enabled=byte(0x8fc8)!==0;
 if(byte(0x9aca)){
  const result=drivingAudioExit({active:byte(0x9fea),read:word(0x9332),write:word(0x8ffc),playerFlags:byte(0x73d8),opponentFlags:byte(0x73dc),opponentEnabled:byte(0x8fc8),playerHandle:word(0x8016),opponentHandle:word(0x86de)});
  v.setUint16(d+0x9332,result.state.read,true);memory[d+0x9fea]=result.state.active;memory[d+0x73d8]=result.state.playerFlags;memory[d+0x73dc]=result.state.opponentFlags;
  return {requests:result.calls as RaceAudioRequest[],record:null};
 }
 const car=(base:number)=>({current:[0,1,2].map(a=>v.getInt32(d+base+a*4,true)) as Vector,previous:[0,1,2].map(a=>v.getInt32(d+base+12+a*4,true)) as Vector,rpm:word(base+34)});
 const mode=byte(0x12f),focus=byte(0xa9f0)!==0;
 let view:AudioListenerView;
 if(mode===0||mode===2)view={mode,focusOpponent:focus};
 else if(mode===1){
  const vector=(base:number)=>[0,1,2].map(a=>v.getInt16(d+base+(focus?6:0)+a*2,true)) as Vector;
  view={mode,current:vector(0x8c06),previous:vector(0x8c12)};
 }else if(mode===3){
  const offset=(word(0x8ff6)+byte(0x8ead+(focus?1:0))*6)&65535,address=word(0x8ff8)*16+offset;
  if(address+6>memory.length)throw Error('Original trackside audio camera is outside memory');
  view={mode,trackside:[0,1,2].map(a=>v.getInt16(address+a*2,true)) as Vector,heightOffset:v.getInt16(d+0x9334,true)};
 }else throw Error('Unknown original audio view mode');
 const index=word(0x8ffc);
 if(index>=40)throw Error('Invalid original audio write index');
 const at=d+0x955e+index*34;
 const record=buildViewAudioSample(memory.subarray(at,at+34),car(0x8c38),enabled?car(0x8cf0):null,view);
 memory.set(record,at);
 for(const [base,flags,handle] of enabled?[[0x8c38,0x73d8,0x8016],[0x8cf0,0x73dc,0x86de]]:[[0x8c38,0x73d8,0x8016]]){
  const transition=updateDrivingSoundFlags(byte(flags),byte(base+0xb7));
  for(const kind of transition.requests)requests.push({kind,handle:word(handle)});
  memory[d+flags]=transition.flags;
 }
 memory[d+0x9fea]=1;v.setUint16(d+0x8ffc,index===39?0:index+1,true);
 return {requests,record};
}
