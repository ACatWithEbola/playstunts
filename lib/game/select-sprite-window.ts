/** Original2792a copies fifteen words forward into the active descriptor.
 * This is not a stack push:27948 restores the fixed video descriptor. */
export function selectOriginalSpriteWindow(memory:Uint8Array,offset:number,segment:number,cs=0x209e0){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(let i=0;i<15;i++)view.setUint16(cs+0x5d94+i*2,view.getUint16((segment&65535)*16+((offset+i*2)&65535),true),true);
}
export function restoreOriginalVideoWindow(memory:Uint8Array,cs=0x209e0){selectOriginalSpriteWindow(memory,0x5db2,cs>>>4,cs);}
