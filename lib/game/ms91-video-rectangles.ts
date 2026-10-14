function view(memory:Uint8Array,d:number){
 if(d<0||!Number.isInteger(d)||d+65536>memory.length)throw Error('Original data segment is outside memory');
 return new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
}
/** Original c359..c3b4: seed repaint flags; unchanged region5 can be skipped
 * when the render identity matches (detail4 suppresses that identity change).
 * Rectangle merging and presentation are separate following operations. */
export function prepareMs91VideoRectangleFlags(memory:Uint8Array,d:number){
 const v=view(memory,d);if(!v.getUint16(d+0x9690,true))return false;
 memory.fill(3,d+0xa224,d+0xa224+15);
 if(memory[d+0x192]===4)v.setUint16(d+0x970a,v.getUint16(d+0xb0da,true),true);
 let equal=v.getUint16(d+0x970a,true)===v.getUint16(d+0xb0da,true);
 for(let i=0;i<4;i++)equal=equal&&v.getUint16(d+0xa278+i*2,true)===v.getUint16(d+0xa686+i*2,true);
 if(equal)memory[d+0xa229]=0;
 memory[d+0xae6a]=0;return true;
}
/** Original MS91 c552..c58b: initialize the working rectangle list and return
 * the caller's mode byte. These offsets are the original MS91 layout only. */
export function initializeMs91VideoRectangles(memory:Uint8Array,d:number){
 const v=view(memory,d);if(!v.getUint16(d+0x9690,true))return {flags:0,rectanglesAddress:null};
 const empty=memory.slice(d+0x339a,d+0x33a2);
 for(let index=0;index<15;index++)memory.set(empty,d+0x9710+index*8);
 return {flags:8,rectanglesAddress:d+0x9710};
}
/** Original MS91 c487..c4b4: retain frame identity and copy15 rectangle records
 * word-for-word after presentation. Does not enable slow-video policy itself. */
export function commitMs91VideoRectangles(memory:Uint8Array,d:number){
 const v=view(memory,d);if(!v.getUint16(d+0x9690,true))return;
 v.setUint16(d+0x970a,v.getUint16(d+0xb0da,true),true);
 for(let index=0;index<15;index++)for(let word=0;word<4;word++)v.setUint16(d+0xa65e+index*8+word*2,v.getUint16(d+0xa250+index*8+word*2,true),true);
}
