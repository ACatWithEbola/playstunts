import {readSoundCommand} from './sound-command.ts';
export interface EffectSequenceState {offset:number|null;wait:number}
export type EffectEvent={kind:'instrument'|'volume';value:number}|{kind:'note';note:number;duration:number;velocity?:number}|{kind:'end'};
/** Original effect scheduler tick, 0x2a2b6. Driver operations are requests. */
export function stepEffectSequence(before:EffectSequenceState,bytes:Uint8Array){
 const state={...before};const events:EffectEvent[]=[];
 if(state.wait){state.wait=(state.wait-1)>>>0;return {...state,events};}
 if(state.offset===null)return {...state,events};
 for(let guard=0;guard<1024;guard++){
  const c=readSoundCommand(bytes,state.offset!);state.offset!+=c.length;
  if(c.opcode===0xdc)events.push({kind:'instrument',value:c.argument!});
  else if(c.opcode===0xde)events.push({kind:'volume',value:c.argument!});
  else if(c.opcode===0xd9){state.offset=null;events.push({kind:'end'});state.wait=0xffffffff;return {...state,events};}
  else {if(c.opcode>=0xd9)throw Error('Unsupported effect control command');events.push({kind:'note',note:c.opcode&127,duration:c.duration!,...(c.opcode>0x80?{velocity:c.argument!}:{})});}
  state.wait=readSoundCommand(bytes,state.offset).delay;
  if(state.wait){state.wait=(state.wait-1)>>>0;return {...state,events};}
 }
 throw Error('Original effect sequence exceeded supported command budget');
}
