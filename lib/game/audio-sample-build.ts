import type {Vector} from '../physics/math.ts';
export interface AudioSampleCar {current:Vector;previous:Vector;rpm:number}
/** Original queue record construction in view modes 0/2, 0xa6fa-0xa976.
 * Positions are original signed 32-bit fixed-point world coordinates.
 */
export function buildFollowingAudioSample(before:Uint8Array,player:AudioSampleCar,opponent:AudioSampleCar|null,focusOpponent:boolean){
 if(before.length!==34)throw Error('Invalid original driving-audio sample');
 const listener=focusOpponent?opponent:player;
 if(!listener)throw Error('Missing followed opponent');
 return buildCameraAudioSample(before,player,opponent,{previous:listener.previous.map(v=>v>>6) as Vector,current:listener.current.map(v=>v>>6) as Vector});
}
/** Original listener coordinates are signed world-unit words, unlike car fixed-point positions. */
export function buildCameraAudioSample(before:Uint8Array,player:AudioSampleCar,opponent:AudioSampleCar|null,listener:{previous:Vector;current:Vector}){
 if(before.length!==34)throw Error('Invalid original driving-audio sample');
 const record=before.slice(),v=new DataView(record.buffer);
 const encode=(car:AudioSampleCar,offset:number,rpmOffset:number)=>{
  for(let axis=0;axis<3;axis++){
   v.setInt16(offset+axis*2,listener.previous[axis]-(car.previous[axis]>>6),true);
   v.setInt16(offset+6+axis*2,listener.current[axis]-(car.current[axis]>>6),true);
  }
  v.setUint16(rpmOffset,car.rpm,true);
 };
 encode(player,6,30);if(opponent)encode(opponent,18,32);
 return record;
}
