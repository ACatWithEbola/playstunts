import type {OriginalRaceResultPanelState} from './race-result-panel.ts';

/** Saved race statistics consumed by595c..5ef5. These are the retained
 * event snapshot at899a, not the cars' current simulation counters. */
export function readOriginalRaceResultMemory(memory:Uint8Array,d:number):{panel:OriginalRaceResultPanelState;raceCounter:number}{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(offset:number)=>view.getUint16(d+offset,true);
 return {
  panel:{
   playerTime:word(0x89a0),opponentTime:word(0x89a2),penaltyTime:word(0x89a8),
   opponentSelected:memory[d+0x8fc8],flags:memory[d+0x8018],
   playerTicks:word(0x89a4),opponentTicks:word(0x89a6),timeAdjustment:word(0xa034),
   speedSum:view.getUint32(d+0x899a,true),impactSpeed:word(0x89aa),topSpeed:word(0x89ac),jumps:word(0x89ae),
  },
  raceCounter:word(0x899e),
 };
}
