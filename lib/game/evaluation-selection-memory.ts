import {selectOriginalEvaluation} from './opponent-evaluation-selection.ts';
import {originalRandomByte,originalRandomWord} from './original-random.ts';

/** Original5eff..605b selection using retained choice/generator state.
 * The caller advances DS407a using the native clock before invoking this. */
export function selectOriginalEvaluationMemory(memory:Uint8Array,d:number,outcome:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const triple=(offset:number):[number,number,number]=>[0,1,2].map(i=>v.getUint16(d+offset+i*2,true)) as [number,number,number];
 const result=selectOriginalEvaluation({current:triple(0x53fa),previous:triple(0x53f4)},memory[d+0x8018],outcome,v.getUint16(d+0x89a0,true),v.getUint16(d+0x899e,true),()=>originalRandomWord(memory,d),()=>originalRandomByte(memory,d));
 result.current.forEach((value,i)=>v.setUint16(d+0x53fa+i*2,value,true));
 result.previous.forEach((value,i)=>v.setUint16(d+0x53f4+i*2,value,true));
 return result;
}
