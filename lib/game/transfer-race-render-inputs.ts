/** Transfer logical MCGA simulation/presentation inputs to an independently
 * allocated alternative renderer. Resource pointers, driver identity and the
 * target's track/camera allocations remain owned by that renderer. */
export function transferNativeRaceRenderInputs(target:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',live:Uint8Array,liveD=0x2d1a0,bp=0xeefe){
 if(target.buffer===live.buffer)throw Error('Simulation and display require independent memory owners');
 if(d<0||liveD<0||d+65536>target.length||liveD+65536>live.length)throw Error('Original render inputs exceed their memory owner');
 const high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high,low={cga:0x5da,tandy:0x616,ega:0x462}[mode];
 const copy=(at:number,length:number,delta=0)=>target.set(live.subarray(liveD+at,liveD+at+length),d+at+delta);
 for(const [at,length] of [[0x126,6],[0x12f,1],[0x134,1],[0x4b80,20],[0x31e9,1]])copy(at,length);
 for(const [at,length] of [[0x8ae6,0x430],[0x8fba,4],[0x8fc6,8],[0x93dc,2],[0x9334,2],[0xaa78,2],[0xa9f0,1],[0x7fe6,8],[0x8002,1],[0xa77f,1],[0x9aca,1]])copy(at,length,high);
 // Each original car parameter allocation ends with a four-byte resistance
 // table pointer. Copy the772 logical bytes and retain that target pointer.
 copy(0x9c52,772,high);copy(0xa46a,772,high);
 for(const [at,length] of [[0x9ac0,2],[0x9fe6,2],[0xaae6,1],[0xa7d2,2],[0xa7da,4],[0xa42a,1],[0xa3c2,1],[0x90f8,1],[0x8fd8,2],[0xa034,2]])copy(at,length,high);
 // Buffer identity and remaining redraw passes belong to the target display.
 // A source redraw requests the target's own pass count (two for default EGA).
 if(live[liveD+0x9ab6])target[d+0x9ab6+high]=Math.max(target[d+0x9ab6+high],target[d+0xa003+high]);
 for(const at of [0x73b2,0x73d6,0x73da])copy(at,2,middle);
 copy(0x5524,9,low);
 // The original full-redraw presentation consumes its enclosing frame locals.
 for(let i=0;i<0x16;i++){const at=(bp-0x16+i)&65535;target[d+at]=live[liveD+at];}
}
