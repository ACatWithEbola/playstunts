/** Original legacy TD15 note-on reads the far sample pointer in instrument+6
 * and the descriptor length at+8. The allocated host supplies live memory;
 * this resolves bytes only, never BIOS/DMA execution timing. */
export function readTandySampleResource(memory:Uint8Array,offset:number,segment:number){
 for(const value of [offset,segment])if(!Number.isInteger(value)||value<0||value>65535)throw Error('Invalid Tandy sample far pointer');
 const base=segment*16;
 if(!(offset|segment)||base+65536>memory.length)throw Error('Tandy sample segment is outside allocated memory');
 // Effective address wraps before the word load; its second byte is the
 // adjacent physical byte, not a second independently wrapped offset.
 const address=base+((offset+8)&65535);
 if(address+1>=memory.length)throw Error('Tandy sample length word is outside allocated memory');
 const length=memory[address]|memory[address+1]<<8;
 return {offset,segment,length};
}
