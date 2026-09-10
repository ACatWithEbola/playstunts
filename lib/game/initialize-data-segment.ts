/** Initialized data and BSS bounds from the supplied executables' C runtime
 * entry (1EC90..1EC9B). This copies data, not executable instructions or a saved
 * game frame. The allocator, display and game startup run separately afterward. */
export function initializeOriginalDataSegment(memory:Uint8Array,d:number,data:Uint8Array,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const [start,end]={mcga:[0x53f4,0xaaf0],cga:[0x59ce,0xb0d0],tandy:[0x5a0a,0xb110],ega:[0x5856,0xaf50]}[mode];
 if(data.length!==start)throw Error('Original initialized data length does not match the display executable');
 if(d<0||!Number.isInteger(d)||d+end>memory.length)throw Error('Original data segment exceeds its memory owner');
 memory.set(data,d);
 memory.fill(0,d+start,d+end);
}
