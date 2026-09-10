import {u16} from './math.ts';
/** Race update 0x9640..0x9703: registers inherited by player_op.
 * replayOffset/checkpointOffset are original loaded far-pointer offsets.
 * The caller must supply SI on entry; it is not a fixed zero value.
 */
export function raceDrivingCaller(frame:number,incomingSI:number,replayOffset:number,checkpointOffset:number):[number,number]{
 frame=u16(frame);
 if(frame%600!==0)return [u16(incomingSI),u16(replayOffset)];
 const checkpoint=frame/600;
 return [checkpoint,u16(checkpointOffset+checkpoint*1072+1072)];
}
