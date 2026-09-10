/** Source222F3 counters retained while Main switches between menus and races.
 * Menu music owns its callbacks separately; this advances only global time. */
export interface RetainedMenuClock {callbackCounter:number;gameCounter:number;divisor:number;countdown:number}
export function readRetainedMenuClock(memory:Uint8Array,d:number):RetainedMenuClock{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return {callbackCounter:v.getUint32(d+0x407a,true),gameCounter:v.getUint32(d+0x407e,true),divisor:v.getUint16(d+0x4086,true),countdown:v.getUint16(d+0x4088,true)};
}
export function writeRetainedMenuClock(memory:Uint8Array,d:number,clock:RetainedMenuClock){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 v.setUint32(d+0x407a,clock.callbackCounter,true);v.setUint32(d+0x407e,clock.gameCounter,true);v.setUint16(d+0x4086,clock.divisor,true);v.setUint16(d+0x4088,clock.countdown,true);
}
/** Unblocked menu IRQs, including the original signed DEC/JG boundary. */
export function advanceRetainedMenuClock(clock:RetainedMenuClock,ticks:number):RetainedMenuClock{
 if(!Number.isSafeInteger(ticks)||ticks<0)throw Error('Menu elapsed ticks must be a nonnegative safe integer');
 if(!ticks)return {...clock};
 const first=Math.max(1,clock.countdown<<16>>16),period=Math.max(1,clock.divisor<<16>>16);
 const increments=ticks<first?0:1+Math.floor((ticks-first)/period);
 const countdown=ticks<first?(clock.countdown-ticks)&65535:(clock.divisor-(ticks-first)%period)&65535;
 return {...clock,countdown,callbackCounter:(clock.callbackCounter+ticks%4294967296)>>>0,gameCounter:(clock.gameCounter+increments%4294967296)>>>0};
}
