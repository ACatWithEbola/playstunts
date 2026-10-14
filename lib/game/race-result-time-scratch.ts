import type {OriginalRaceResultTimes} from './race-result-lines.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
/** Six original MS91 retained numeric-formatter words. Caller must supply the
 * actual result-frame BP, not an enclosing frame guessed from legacy offsets.
 * Other original stack writes remain outside this bounded reconstruction. */
export function writeMs91ResultTimeFields(memory:Uint8Array,d:number,resultFrameBP:number,ticks:number,framesPerSecond:10|20=20){
 const rate=resolveReplayCadence(framesPerSecond),count=ticks&65535;
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(delta:number,value:number)=>view.setUint16(d+((resultFrameBP+delta)&65535),value&65535,true);
 word(-0xe4,resultFrameBP-0xc0);word(-0xe2,10);
 word(-0xe0,Math.trunc(count/(60*rate)));word(-0xde,Math.trunc(count%(60*rate)/rate));
 word(-0xd8,resultFrameBP-0xae);word(-0xd6,0x245e);
}
/** Result lines59B3..5C37 call1BBF2 with the same local time buffer. Its
 * final1BA1A call leaves these proven words below the results frame. Other
 * formatter scratch is deliberately retained until its writes are recovered. */
export function writeOriginalRaceResultTimeScratch(memory:Uint8Array,d:number,bp:number,state:OriginalRaceResultTimes){
 const player=state.playerTime&65535,penalty=state.penaltyTime&65535,opponent=state.opponentTime&65535;
 let ticks:number|undefined=player?player-penalty:undefined;
 if(player&&penalty)ticks=penalty;
 if((state.opponentSelected&255)&&opponent)ticks=opponent;
 if(ticks===undefined)return;
 if(state.physicsEngine==='ms-1991'){
  writeMs91ResultTimeFields(memory,d,bp,ticks,state.framesPerSecond??20);
  return;
 }
 ticks=ticks<<16>>16;
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(delta:number,value:number)=>view.setUint16(d+((bp+delta)&65535),value&65535,true);
 word(-0xe2,bp-0xc0);word(-0xe0,10);
 word(-0xde,Math.trunc(ticks/1200));word(-0xdc,Math.trunc(ticks%1200/20));
 word(-0xd6,bp-0xae);word(-0xd4,0x23d3);
}
