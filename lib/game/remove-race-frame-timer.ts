import {removeOriginalTimerCallback} from './remove-timer-callback.ts';
/** Original2463b unsigned deadline comparison, including immediate completion
 * when addition wraps below the current counter. Always reads twice or more. */
export async function waitOriginalGameTicks(counter:()=>Promise<number>,ticks:number){
 const target=((await counter())+(ticks>>>0))>>>0;
 while(((await counter())>>>0)<target){ /* The original waits on the game clock. */ }
}
/** Original142f8..14316 waits ten DS407a callback-clock ticks before removing
 * 14318. The host must not supply the divided DS407e simulation counter. */
export async function removeNativeRaceFrameTimer(host:{memory():Uint8Array;gameCounter():Promise<number>},d:number){
 await waitOriginalGameTicks(()=>host.gameCounter(),10);
 removeOriginalTimerCallback(host.memory(),d,0x9b8,0x1396);
}
