/** Original 13F06..13F24: finish rollout by reinitializing the race, with -1.
 * The initializer is the existing original race initializer, not a pose reset.
 */
export function finishOriginalStartTruck(memory:Uint8Array,d:number,initialize:(memory:Uint8Array,argument:-1)=>Uint8Array){
 if(memory[d+0xa3c2]!==1||memory[d+0x7fee]!==0)return memory;
 memory[d+0xa3c2]=0;
 return initialize(memory,-1);
}
