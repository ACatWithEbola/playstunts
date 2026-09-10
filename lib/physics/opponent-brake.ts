import {i16,u16} from './math.ts';
/** Supplied opponent branch 0xa310..0xa498, before contact/speed reconciliation. */
export function opponentBrake(speed:number,force:number,braking:number){
 const delta=i16(force-i16(braking*2));speed=u16(speed);
 if(delta<0)speed=u16(-delta)>speed?0:u16(speed+delta);
 else speed=Math.min(u16(speed+delta),0xf500);
 return {speed,delta,accelerating:0,braking:1,limiter:0};
}
