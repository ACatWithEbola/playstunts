import type {OriginalRaceResultTimes} from './race-result-lines.ts';
/** Result lines59B3..5C37 call1BBF2 with the same local time buffer. Its
 * final1BA1A call leaves these proven words below the results frame. Other
 * formatter scratch is deliberately retained until its writes are recovered. */
export function writeOriginalRaceResultTimeScratch(memory:Uint8Array,d:number,bp:number,state:OriginalRaceResultTimes){
 const player=state.playerTime&65535,penalty=state.penaltyTime&65535,opponent=state.opponentTime&65535;
 let ticks:number|undefined=player?player-penalty:undefined;
 if(player&&penalty)ticks=penalty;
 if((state.opponentSelected&255)&&opponent)ticks=opponent;
 if(ticks===undefined)return;
 ticks=ticks<<16>>16;
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(delta:number,value:number)=>view.setUint16(d+((bp+delta)&65535),value&65535,true);
 word(-0xe2,bp-0xc0);word(-0xe0,10);
 word(-0xde,Math.trunc(ticks/1200));word(-0xdc,Math.trunc(ticks%1200/20));
 word(-0xd6,bp-0xae);word(-0xd4,0x23d3);
}
