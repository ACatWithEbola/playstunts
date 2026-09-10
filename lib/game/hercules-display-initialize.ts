/** Supplied CGA executable22018..2206E, selected by SETUP's CGA /h.
 * The CGA rasterizer remains in use. Hardware scanout is a separate task. */
export function initializeOriginalHerculesDisplay(memory:Uint8Array,d:number,host:{biosMode(mode:number):void;out(port:number,value:number):void}){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 memory[d+0x405c]=1;
 v.setUint16(0x410,(v.getUint16(0x410,true)&0xffcf)|0x20,true);
 host.biosMode(4);
 host.out(0x3bf,3);host.out(0x3b8,2);
 for(let index=0;index<12;index++){host.out(0x3b4,index);host.out(0x3b5,memory[d+0x405e+index]);}
 memory.fill(0,0xb8000,0xc0000);
 host.out(0x3b8,0x8a);
}

/** Supplied CGA220DA..22139. The retained Hercules flag is not cleared.
 * The non-Hercules path delegates to the separate original CGA text reset. */
export function restoreOriginalHerculesText(memory:Uint8Array,d:number,host:{biosMode(mode:number):void;out(port:number,value:number):void;restoreCgaText():void}){
 if(!memory[d+0x405c]){host.restoreCgaText();return;}
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 v.setUint16(0x410,(v.getUint16(0x410,true)&0xffcf)|0x30,true);
 host.out(0x3bf,3);host.out(0x3b8,0x20);
 for(let index=0;index<12;index++){host.out(0x3b4,index);host.out(0x3b5,memory[d+0x406a+index]);}
 memory.fill(0,0xb8000,0xc0000);host.out(0x3b8,0x28);host.biosMode(7);
}
