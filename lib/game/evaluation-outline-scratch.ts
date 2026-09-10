/** Continue's1BAC0 ->27FF0 ->253AC outline call, with its fixed original
 * rectangle128..199 /174..197. These words survive the later clear and
 * become the prefix of the candidate high-score record. Only redraws write it. */
export function writeOriginalEvaluationOutlineScratch(memory:Uint8Array,d:number,bp:number,delta:number,colour:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),start=(bp-0xe6)&65535;
 const words=[delta,bp-0xd0,0x82,0x27ff,199,174,0,23,colour,23,72,bp-0xb6,0x2257,0x198d,128,174];
 words.forEach((value,index)=>view.setUint16(d+((start+index*2)&65535),value&65535,true));
}
