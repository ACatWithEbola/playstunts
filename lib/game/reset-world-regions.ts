/** Original BEA1..BEC2 starts each world frame with fifteen empty regions.
 * Model projection expands these bounds; retaining them accumulates old views. */
export function resetOriginalWorldRegions(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],empty=memory.slice(d+0x3312,d+0x331a);
 for(let i=0;i<15;i++)memory.set(empty,d+0x901a+high+i*8);
}
