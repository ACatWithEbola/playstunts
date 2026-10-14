/** Driver initialization records its hardware-slot count in the game data.
 * This identifies the retained sound driver, never a replay's physics. */
export function loadedPc15Generation(memory:Uint8Array,d:number):'ms-1990'|'ms-1991'{
 if(!Number.isInteger(d)||d<0||d+65536>memory.length)throw Error('PC15 data segment is outside memory');
 const slots=memory[d+0x9fe4];
 if(slots===5)return 'ms-1990';
 if(slots===7)return 'ms-1991';
 throw Error('PC15 driver has not initialized a supported slot layout');
}
