/** Read-only telemetry for this exact Mindscape 1.1 executable.
 * Addresses recovered from its startup data-segment relocation, lookup-table
 * signature, and player-state pointer in the intro-driving call site.
 * Never apply these offsets to Brøderbund 1.1: its car structure is different.
 */
import { sine_table } from './tables.ts';
import type { Vector } from './math.ts';
export interface ReferencePose{frame:number;position:[number,number,number];rotation:[number,number,number];rpm:number;engineSpeedRaw:number;roadSpeedRaw:number}
const SINE_OFFSET_IN_DATA=0x4bc6;
const PLAYER_OFFSET_IN_DATA=0x8c38;
/** car_whlWorldCrds1: resolved points before suspension offsets, world units. */
export function readReferenceWheelPositions(memory:Uint8Array,base:number):Vector[]{
 const p=base+PLAYER_OFFSET_IN_DATA+0x74;
 if(base<0||p+24>memory.length)throw Error('Wheel positions are outside the memory snapshot');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return Array.from({length:4},(_,wheel)=>[0,1,2].map(axis=>v.getInt16(p+wheel*6+axis*2,true)) as Vector);
}
export function locateReferenceData(memory:Uint8Array):number|null{
 const signature=new Uint8Array(sine_table.length*2);const v=new DataView(signature.buffer);sine_table.forEach((n,i)=>v.setInt16(i*2,n,true));
 let match:number|null=null;
 outer:for(let start=SINE_OFFSET_IN_DATA;start+signature.length<memory.length;start++){
  if(memory[start]!==0||memory[start+1]!==0||memory[start+2]!==101||memory[start+3]!==0)continue;
  for(let i=4;i<signature.length;i++)if(memory[start+i]!==signature[i])continue outer;
  const base=start-SINE_OFFSET_IN_DATA;
  if(base%16||base+PLAYER_OFFSET_IN_DATA+0xb8>memory.length)continue;
  if(match!==null)throw Error('Ambiguous game-memory signature');match=base;
 }
 return match;
}
export function readReferencePose(memory:Uint8Array,base:number):ReferencePose{
 const p=base+PLAYER_OFFSET_IN_DATA;if(base<0||p+0xb8>memory.length)throw Error('Player state is outside the memory snapshot');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);const s=(o:number)=>v.getInt16(p+o,true),u=(o:number)=>v.getUint16(p+o,true),l=(o:number)=>v.getInt32(p+o,true);
 return {frame:u(-18),position:[l(0),l(4),l(8)],rotation:[s(24),s(26),s(28)],rpm:s(34),engineSpeedRaw:u(42),roadSpeedRaw:u(44)};
}
import type { EngineState } from './engine.ts';
export function readReferenceEngine(memory:Uint8Array,base:number):EngineState{return readCarEngine(memory,base+PLAYER_OFFSET_IN_DATA);}
export function readCarEngine(memory:Uint8Array,offset=0):EngineState{
 const p=offset;if(p<0||p+0xb8>memory.length)throw Error('Player state is outside the memory snapshot');const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);const s=(o:number)=>v.getInt16(p+o,true),u=(o:number)=>v.getUint16(p+o,true),b=(o:number)=>v.getUint8(p+o);
 return {speed:u(42),roadSpeed:u(44),lastSpeed:u(46),speedDiff:s(40),rpm:s(34),lastRPM:s(36),gear:b(0xa6),ratio:u(48),ratioHigh:u(50),gravity:s(30),rearContact:b(0xa8),allContact:b(0xa9),automatic:b(0xb4),shifting:b(0xb2),shiftTimer:b(0xb3),limiter:b(0xae),knobX:s(52),knobY:s(56),targetX:s(58),targetY:s(60),accelerating:b(0xa5),braking:b(0xa4)};
}
import type { GripState } from './grip.ts';
export function readReferenceGrip(memory:Uint8Array,base:number):GripState{return readCarGrip(memory,base+PLAYER_OFFSET_IN_DATA);}
export function readCarGrip(memory:Uint8Array,offset=0):GripState{
 const p=offset;
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const s=(o:number)=>v.getInt16(p+o,true),u=(o:number)=>v.getUint16(p+o,true),b=(o:number)=>v.getUint8(p+o);
 return {speed:u(42),roadSpeed:u(44),steeringAngle:s(32),wheelAngle:s(54),spin:s(62),frontWheelAngle:s(64),slip:s(66),demandedGrip:s(68),surfaceGrip:s(70),allContact:b(0xa9),surfaces:[b(0xaa),b(0xab),b(0xac),b(0xad)],sliding:b(0xaf),crash:b(0xb1),soundFlags:b(0xb7),yaw:s(24),roll:s(28)};
}
export function readReferenceSuspension(memory:Uint8Array,base:number){return readCarSuspension(memory,base+PLAYER_OFFSET_IN_DATA);}
export function readCarSuspension(memory:Uint8Array,offset=0){
 const p=offset;const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const four=(o:number)=>Array.from({length:4},(_,i)=>v.getInt16(p+o+i*2,true));
 return {rc1:four(0x4c),rc2:four(0x54),rc4:four(0x64),rc5:four(0x6c)};
}
