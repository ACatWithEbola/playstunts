export interface OriginalMusicTimerState {accumulator:number;interval:number;tracks:number}
/** Original 0x2a23e..0x2a288. Callbacks may change the tempo or track count. */
export function stepOriginalMusicTimer(state:OriginalMusicTimerState,release:()=>void,sequence:(track:number)=>void):void {
 state.accumulator=(state.accumulator+128)&0xffff;
 while(state.accumulator>=(state.interval&0xffff)) {
  if((state.interval&0xffff)===0)throw Error('Original music tempo interval is zero');
  release();
  state.accumulator=(state.accumulator-state.interval)&0xffff;
  for(let track=0;track<(state.tracks&255);track++)sequence(track);
 }
}
