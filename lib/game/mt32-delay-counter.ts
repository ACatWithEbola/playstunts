/** Intel8254 mode3, initial odd countFFFF, first high half-cycle only.
 * One clock loads FFFE; subsequent clocks decrement by two. This bounded
 * model covers both MS1991 delay thresholds, not general PIT operation. */
export function mt32DelayCounterFirstHighHalf(clocks:number){
 if(!Number.isSafeInteger(clocks)||clocks<1||clocks>32767)throw Error('Outside verified Roland delay half-cycle');
 return 65534-2*(clocks-1);
}
/** Intel8254 mode3 odd-count sequence (datasheet pp3-74/3-75,Figure18).
 * High phase retains zero for one clock; low phase reloads immediately at
 * expiry. Clock1 loads N-1. Gate/reprogram effects belong to the host. */
export function mt32OddMode3Counter(clocks:number,reload=65535){
 if(!Number.isSafeInteger(clocks)||clocks<1||!Number.isInteger(reload)||reload<3||reload>65535||!(reload&1))throw Error('Invalid odd mode3 counter');
 const phase=(clocks-1)%reload,highLength=(reload+1)/2;
 return phase<highLength?reload-1-2*phase:reload-1-2*(phase-highLength);
}
