/** Supplied 1399D..139FD with idle/demo flag DS:90F8 clear. Manual recorded
 * playback sets DS:9ACA, which the original audio producer treats as exit.
 */
export function enterManualRace(before:Uint8Array,d:number){
 if(d<0||d+65536>before.length)throw Error('Original data segment is outside memory');
 if(before[d+0x90f8]!==0)throw Error('Demo entry requires its separate original caller');
 const memory=before.slice(),v=new DataView(memory.buffer);
 const replay=v.getUint16(d+0x8fd8,true)!==0;
 memory[d+0x12f]=0;memory[d+0xa3c2]=replay?2:1;memory[d+0x9aca]=Number(replay);
 return memory;
}
