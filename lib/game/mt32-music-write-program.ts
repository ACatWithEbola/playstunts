import {writeOriginalMt32Mpu,type OriginalMt32MpuProgram} from './mt32-transport.ts';
import {sendOriginalMt32SystemExclusive} from './mt32-system-exclusive.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';

/** Preserve callback MIDI order while restoring modern instrument SysEx
 * pacing. Validate complete packets before producing any device operation. */
export function createMt32MusicWriteProgram(driver:Uint8Array,writes:number[][],generation:PhysicsEngineVersion):OriginalMt32MpuProgram{
 const parts:({byte:number}|{payload:Uint8Array})[]=[];
 for(let i=0;i<writes.length;i++){
  const [port,byte]=writes[i];
  if(port!==0x330||!Number.isInteger(byte)||byte<0||byte>255)throw Error('Invalid Roland music output');
  if(generation!=='ms-1991'||byte!==0xf0){parts.push({byte});continue;}
  let end=i+1;while(end<writes.length&&writes[end][0]===0x330&&writes[end][1]!==0xf7)end++;
  if(end>=writes.length||writes[end][0]!==0x330)throw Error('Incomplete Roland music system-exclusive packet');
  const packet=writes.slice(i,end+1).map(([_,value])=>value);
  // Preserve original high-bit payload quirks (notably MIDI channel0's part
  // address). Only the checksum itself is necessarily seven-bit.
  if(packet.length<8||packet.slice(0,5).some((value,index)=>value!==[0xf0,0x41,0x10,0x16,0x12][index])||packet.slice(5,-1).some(value=>!Number.isInteger(value)||value<0||value>255)||packet.at(-2)!>127||((packet.slice(5,-1).reduce((sum,value)=>sum+value,0)&127)!==0))throw Error('Invalid Roland music system-exclusive packet');
  parts.push({payload:Uint8Array.from(packet.slice(5,-2))});i=end;
 }
 return (function*():OriginalMt32MpuProgram{
  for(const part of parts){
   if('byte' in part)yield* writeOriginalMt32Mpu(driver,part.byte);
   else yield* sendOriginalMt32SystemExclusive(driver,(_,offset)=>part.payload[offset],0,0,part.payload.length,generation);
  }
  return 0;
 })();
}
