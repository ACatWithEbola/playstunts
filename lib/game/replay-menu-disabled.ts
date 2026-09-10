/** Original16061..160b0, in the eight unchanged GAME emen choice slots. */
export function originalReplayMenuDisabled(memory:Uint8Array,d:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),disabled=Array<number>(8).fill(0);
 if(memory[d+0x8ce9])disabled[3]=1;
 if(v.getUint16(d+0x8fd8,true)===0||v.getUint16(d+0xa034,true)!==0)disabled[5]=1;
 if(memory[d+0xa42a]===0){disabled[2]=1;disabled[3]=1;}
 if(!(memory[d+0x8018]&4))disabled[1]=1;
 return disabled;
}
