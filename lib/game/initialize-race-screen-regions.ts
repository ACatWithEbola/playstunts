/** Original BE36: seed both sets of 15 retained screen rectangles. */
export function initializeOriginalRaceScreenRegions(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const delta={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const copy=(source:number,destination:number)=>{for(let i=0;i<8;i+=2)view.setUint16(d+destination+delta+i,view.getUint16(d+source+i,true),true);};
 copy(0x882,0x9b5e);copy(0x882,0x9f6c);
 for(let i=1;i<15;i++){copy(0x3312,0x9b5e+i*8);copy(0x3312,0x9f6c+i*8);}
}
