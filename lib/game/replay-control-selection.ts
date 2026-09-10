/** Original15871..15886: selection is a word offset, including its original
 * segment wrap. Valid replay controls occupy the first nine bytes. */
export function selectOriginalReplayControl(memory:Uint8Array,d:number,selected:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const at=0x5524+{mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 memory.fill(0,d+at,d+at+9);
 memory[d+((at+selected)&65535)]=1;
}
