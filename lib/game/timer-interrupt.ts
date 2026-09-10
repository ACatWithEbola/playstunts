/** Supplied executable setup at 0x2213a/0x2215a, not a rounded Hz rate. */
export const ORIGINAL_PIT_DIVISOR = 0x2e9c;
export const ORIGINAL_GAME_TIMER_DIVIDER = 5;
/** Nominal PC PIT input clock, independently corroborated by Linux timex.h:
 * https://github.com/torvalds/linux/blob/master/include/linux/timex.h
 * This is a hardware clock convention, not a constant recovered from Stunts.
 */
export const PC_PIT_INPUT_HZ = 1193182;

export interface TimerCounters {
 countdown:number;
 gameCounter:number;
 callbackCounter:number;
}

/** Counter path at 0x222f3-0x2232b with callbacks enabled and no reentry.
 * BIOS chaining and callback execution are the caller's responsibility.
 */
export function advanceTimerCounters(state:TimerCounters):TimerCounters {
 let countdown=(state.countdown-1)&0xffff;
 let gameCounter=state.gameCounter>>>0;
 // DEC/JG tests the signed mathematical result, including overflow.
 if((state.countdown<<16>>16)<=1){
  countdown=ORIGINAL_GAME_TIMER_DIVIDER;
  gameCounter=(gameCounter+1)>>>0;
 }
 return {countdown,gameCounter,callbackCounter:(state.callbackCounter+1)>>>0};
}
