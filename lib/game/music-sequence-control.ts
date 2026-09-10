/** Original sequencer DB/E6/E9 branches at2A40A,2A3AC and2A588.
 * E6 receives an already advanced command pointer; its destination skips the
 * sequence's four-byte header without carrying into the segment. */
export function applyMusicSequenceControl(timer:Uint8Array,opcode:number,argument:number,destination=0):boolean{
 const v=new DataView(timer.buffer,timer.byteOffset,timer.byteLength);
 if(opcode===0xdb){timer[4]=0;timer[0x32]=0;v.setUint32(0,v.getUint32(5,true),true);}
 else if(opcode===0xe6){timer[4]++;v.setUint32(5+timer[4]*4,v.getUint32(0,true),true);v.setUint16(0,((destination&65535)+4)&65535,true);v.setUint16(2,destination>>>16,true);}
 else if(opcode===0xe9)timer[0x47]=argument;
 // E8 calls driver entry39; AD15 returns FFFF without changing state.
 else if(opcode===0xe7||opcode===0xe8||opcode>0xea){}
 else return false;
 return true;
}
