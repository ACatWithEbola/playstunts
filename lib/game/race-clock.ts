import {i16} from '../physics/math.ts';
export interface RaceClockState {frame:number;counter:number;timer:number;evaluationCause:number;done:number;crash:number;roadSpeed:number;mode:number}
/** Original 96b0..96f6: frame count and end-of-race delay, before car updates. */
export function advanceRaceClock(before:RaceClockState){
 const state={...before,frame:(before.frame+1)&65535};
 if((before.evaluationCause&255)&&i16(before.counter)<i16(before.timer)){
  state.counter=(before.counter+1)&65535;
  if(state.counter===(before.timer&65535)&&!(before.done&255)){
   if((before.crash&255)===1&&(before.roadSpeed&65535))state.timer=(before.timer+1)&65535;
   else if(!(before.mode&255))state.done=1;
  }
 }
 return state;
}
