/** MT-32 ROM1.07 4391..43BD. This is only the allocation-shortfall
 * decision, after the firmware has handled single assignment. It does not
 * replace voice allocation, SysEx forwarding or MIDI serial scheduling. */
const forwardedVelocity = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,9,9,10,10,11,11,12,13,13,14,14,15,15,16,17,17,18,18,19,19,20,21,21,22,22,23,23,24,25,25,26,27,28,28,29,30,31,31,32,33,33,34,35,35,36,37,37,38,39,40,40,41,42,42,43,44,44,45,46,47,48,48,49,50,50,51,52,53,54,55,56,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,76,77,78,80,81,83,85,87,88,90,91,92,94,96,98,100,102,105,108,113,120,127] as const;
export function originalMt32OverflowAllocation(free:number,needed:number,enabled:boolean,channel:number,key:number,internalVelocity:number){
 if(![free,needed,channel,key,internalVelocity].every(Number.isInteger)||free<0||free>32||needed<1||needed>4||channel<0||channel>15||key<0||key>127||internalVelocity<0||internalVelocity>127)throw RangeError('Invalid MT-32 allocation state');
 if(free>=needed)return {action:'allocate' as const,bytes:[] as number[]};
 if(!enabled)return {action:'reclaim' as const,bytes:[] as number[]};
 return {action:'forward' as const,bytes:[0x90+channel,key,forwardedVelocity[internalVelocity]]};
}

const incomingVelocity = [0,1,3,5,7,9,11,13,15,16,18,20,22,23,25,27,29,30,32,34,36,37,39,41,43,44,46,47,48,50,51,52,54,55,57,58,60,61,63,64,65,67,68,70,71,73,74,75,76,78,79,81,82,83,84,85,86,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,105,106,91,108,109,109,110,111,111,112,112,113,113,114,115,115,116,117,118,118,119,119,120,120,121,121,122,122,123,123,123,124,124,124,125,125,125,125,125,126,126,126,126,126,126,126,127,127,127,127,127,127,127] as const;
/** ROM1.07 4120..414B, with the parser's 0x80 absent-data sentinel.
 * The caller still owns channel lookup and actual MIDI delivery. */
export function originalMt32OverflowRouting(status:number,key:number,data:number,enabled:boolean){
 if(![status,key,data].every(Number.isInteger)||status<0x80||status>0xef||key<0||key>127||data<0||data>128)throw RangeError('Invalid MT-32 channel message');
 if(!enabled)return {data,bytes:[] as number[]};
 if((status&0xf0)===0x90&&data!==0){
  if(data===128)throw RangeError('MT-32 note-on requires velocity');
  return {data:incomingVelocity[data],bytes:[] as number[]};
 }
 return {data,bytes:data===128?[status,key]:[status,key,data]};
}
