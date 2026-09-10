import {decodeOriginalReplayFile} from './replay-file.ts';
import {createNativeRaceSession,type NativeRaceData} from './native-race-session.ts';
/** Load original-format recordings into native simulation. Car resources
 * must match the original header. Replay-menu entry subsequently seeks to the
 * final frame, as the source13b04 caller does; this constructor prepares state.
 */
export function createNativeReplaySession(data:Omit<NativeRaceData,'raw'>,carId:string,bytes:Uint8Array,opponentCarId?:string){
 const replay=decodeOriginalReplayFile(bytes),id=String.fromCharCode(...replay.header.subarray(0,4));
 if(id!==carId)throw Error('Replay car resources do not match the original header');
 if(replay.header[6]!==0){
  const opponentId=String.fromCharCode(...replay.header.subarray(7,11));
  if(opponentId!==(opponentCarId??(!data.opponent?carId:undefined)))throw Error('Replay opponent car resources do not match the original header');
  if(opponentId!==carId&&!data.opponent)throw Error('Replay requires separate opponent simulation resources');
 }
 if(!replay.inputs.length||replay.inputs.length>12000)throw Error('Replay requires an original supported recording length');
 const startup=data.startup.slice(),d=0x2d1a0,view=new DataView(startup.buffer),bank=view.getUint16(d+0xa772,true)+view.getUint16(d+0xa774,true)*16;
 if(bank+bytes.length>startup.length)throw Error('Replay bank is outside original memory');
 startup.set(bytes,bank);startup.set(replay.header,d+0x8fc2);
 return createNativeRaceSession({...data,startup,raw:[...replay.track.track,...replay.track.terrain]},{opponentSelected:replay.header[6],replayInputs:replay.inputs});
}
