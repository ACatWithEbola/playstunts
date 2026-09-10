export interface AllocationVoice {
 owner:number;status:number;priority:number;age:number;channel:number;timerPointer:number;
}
export interface AllocationTimer {
 pointer:number;count:number;limit:number;owner:number;priority:number;
}
export interface HardwareAllocationInput {
 alternate:boolean;instrumentMask:number;channelMasks:number[];
 voices:AllocationVoice[];timers:AllocationTimer[];requester:number;
}
export interface AllocationCall {offset:number;channel:number;voice:number}

/** Supplied executable 0x2ac4c. Driver calls are emitted in original order;
 * the allocator itself leaves hardware voice records unchanged.
 */
export function allocateHardwareVoice(input:HardwareAllocationInput){
 const {alternate,instrumentMask,channelMasks,voices,timers,requester}=input;
 if(alternate&&voices.length!==16)throw Error('Alternate driver requires 16 voice records');
 if(!alternate&&channelMasks.length!==voices.length)throw Error('Missing hardware channel masks');
 const timer=timers[requester];
 if(!timer)throw Error('Missing requesting timer');
 const counts=timers.map(t=>t.count&255),calls:AllocationCall[]=[];
 const result=(voice:number)=>({voice,counts,calls});
 if((instrumentMask&65535)===0)return result(-1);
 const ownerOnly=!alternate&&timer.count>=timer.limit;
 let active=-1,released=-1,activeAge=0,releasedAge=0;
 for(let index=0;index<voices.length;index++){
  const voice=voices[index];
  if(!alternate&&(!(instrumentMask&channelMasks[index])||(ownerOnly&&voice.owner!==timer.owner)))continue;
  if(voice.status===0){
   if(!alternate)counts[requester]=(counts[requester]+1)&255;
   return result(index);
  }
  if(!alternate&&timer.priority<voice.priority)continue;
  const age=voice.age>>>0;
  // Strict comparison: age zero is never a stealing candidate; ties keep first.
  if(voice.status===1&&age>activeAge){active=index;activeAge=age;}
  if(voice.status===2&&age>releasedAge){released=index;releasedAge=age;}
 }
 const chosen=released!==-1?released:active;
 if(chosen===-1)return result(-1);
 if(alternate&&released!==-1)return result(chosen);
 const voice=voices[chosen];
 if(!alternate&&!ownerOnly&&voice.timerPointer!==timer.pointer){
  const previous=timers.findIndex(t=>t.pointer===voice.timerPointer);
  if(previous===-1)throw Error('Missing previous owner timer');
  counts[previous]=(counts[previous]-1)&255;
  counts[requester]=(counts[requester]+1)&255;
 }
 const channel=alternate?voice.channel:chosen;
 calls.push({offset:0x0c,channel,voice:chosen},{offset:0x0f,channel,voice:chosen});
 return result(chosen);
}
