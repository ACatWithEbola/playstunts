import {allocateHardwareVoice} from './hardware-allocation.ts';
import {initializeNoteVoice} from './note-voice.ts';

export interface NoteStartInput {
 alternate:boolean;channelMasks:number[];owner:number;instrument:Uint8Array;
 timers:Uint8Array[];voices:Uint8Array[];command:Uint8Array;lastNotes:Uint8Array;
 /** Original percussion lookup changes the local instrument pointer only. */
 instrumentPointer?:{offset:number;segment:number};
}
export interface NoteDriverCall {offset:number;args:number[]}
export interface NoteDriverContext {voices:Uint8Array[];timers:Uint8Array[];instrument:Uint8Array;command:Uint8Array}
const view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
const timerAddress=(i:number)=>0x801e+72*i;
const voiceAddress=(i:number)=>0xa036+46*i;
const signedByte=(n:number)=>n<<24>>24;

/** Original 0x2a96a note start, including real allocator and initialization.
 * Calls carry original near/far pointer arguments for the driver adapter.
 * An optional adapter runs synchronously at each original call site, so driver
 * mutations happen before subsequent initialization and note-on operations.
 * Without an adapter, nested driver operations are intercepted as in the oracle.
 */
export function startNote(input:NoteStartInput,driver?:(call:NoteDriverCall,context:NoteDriverContext)=>void){
 const {alternate,channelMasks,owner,instrument}=input;
 if(instrument.length<58||instrument[5]===5)throw Error('Missing instrument or unreconstructed percussion remapping');
 if(input.timers.length!==24||input.timers.some(t=>t.length!==72)||input.voices.some(v=>v.length!==46)||input.command.length!==10||input.lastNotes.length!==24)throw Error('Invalid original note-start records');
 if(!Number.isInteger(owner)||owner<0||owner>=24)throw Error('Invalid note owner');
 const timers=input.timers.map(t=>t.slice()),voices=input.voices.map(v=>v.slice());
 const command=input.command.slice(),lastNotes=input.lastNotes.slice(),calls:NoteDriverCall[]=[];
 const dispatch=(call:NoteDriverCall)=>{calls.push(call);driver?.(call,{voices,timers,instrument,command});};
 const timer=timers[owner],tv=view(timer),offset=input.instrumentPointer?.offset??tv.getUint16(0x1e,true),segment=input.instrumentPointer?.segment??tv.getUint16(0x20,true);
 const result=(voice:number)=>({voice,voices,timers,command,lastNotes,calls});
 if((offset|segment)===0)return result(-1);
 const allocated=allocateHardwareVoice({alternate,channelMasks,requester:owner,instrumentMask:view(instrument).getUint16(12,true),
  timers:timers.map((t,i)=>({pointer:timerAddress(i),count:t[0x15],limit:t[0x16],owner:t[0x23],priority:t[0x24]})),
  voices:voices.map(v=>({owner:v[0],status:v[1],priority:v[2],age:view(v).getUint32(8,true),channel:v[0x2c],timerPointer:view(v).getUint16(0x2a,true)}))});
 allocated.counts.forEach((count,i)=>{timers[i][0x15]=count;});
 for(const c of allocated.calls)dispatch({offset:c.offset,args:[c.channel,voiceAddress(c.voice)]});
 const index=allocated.voice;
 if(index===-1)return result(-1);
 const record=voices[index],rv=view(record),pointer=voiceAddress(index),timerPointer=timerAddress(owner);
 if(rv.getUint16(0x10,true)!==offset||rv.getUint16(0x12,true)!==segment){
  rv.setUint16(0x10,offset,true);rv.setUint16(0x12,segment,true);
  if(!alternate)dispatch({offset:0x21,args:[index,pointer,timerPointer,offset,segment]});
 }
 voices[index]=initializeNoteVoice(record,instrument,timer,view(command).getUint32(6,true),owner,index,alternate,timerPointer);
 const channel=voices[index][0x2c];
 if(command[4]===255){
  dispatch({offset:0x24,args:[channel,pointer,view(command).getUint16(0,true)]});
  if(alternate)command[4]=60;
 }
 dispatch({offset:9,args:[channel,pointer,timerPointer,(signedByte(command[4])+signedByte(instrument[16]))&65535,command[5],offset,segment]});
 lastNotes[owner]=command[4];
 return result(index);
}
