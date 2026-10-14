import {stepMs91TandyDifferentialSample} from './ms91-tandy-differential-sample.ts';
/** Original TD15 MS1991 raw0A66/differential0AE4 IRQ bodies.
 * One explicitly delivered interrupt; no implicit CPU/PIT scheduling or BIOS.
 */
export function stepMs91TandySampleIrq(memory:Uint8Array,driverSegment:number,differential:boolean){
 const base=driverSegment*16;
 if(!Number.isInteger(driverSegment)||driverSegment<0||driverSegment>65535||memory.length<0x100000||base+3241>memory.length)throw Error('Invalid modern Tandy IRQ memory');
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const byte=(at:number)=>memory[base+at],word=(at:number)=>view.getUint16(base+at,true),put=(at:number,n:number)=>view.setUint16(base+at,n&65535,true);
 const sample=(offset:number,segment:number)=>memory[((segment<<4)+offset)&0xfffff];
 const writes:number[][]=[[0x21,0xfc]];
 const finish=()=>{
  const countdown=(word(0x590)-1)&65535;put(0x590,countdown);
  if(countdown){writes.push([0x20,0x20]);return {writes,returnKind:'iret' as const};}
  put(0x590,word(0x58e));return {writes,returnKind:'chain' as const,vector:{offset:word(0x588),segment:word(0x58a)}};
 };
 const stop=()=>{
  memory[base+0x595]=0;view.setUint16(0x20,word(0x588),true);view.setUint16(0x22,word(0x58a),true);
  writes.push([0x43,0x36],[0x40,byte(0x58c)],[0x40,byte(0x58d)],[0xc4,0],[0x21,byte(0x592)]);
 };
 const repeat=()=>{if(byte(0x582)){memory[base+0x582]=(byte(0x582)-1)&255;if(!byte(0x582))stop();}};
 const cursor=word(0x57e),segment=word(0x580);
 if(!differential){
  const value=sample(cursor,segment);
  if(cursor>=word(0x57c)){put(0x57e,word(0x578));repeat();}
  else {put(0x57e,cursor+1);writes.push([0xc5,value]);}
 }else{
  const before={phase:byte(0x5a6),packed:byte(0x5a7),accumulator:byte(0x5a8),lastOutput:byte(0x587)};
  const nextPhase=before.phase^255;
  if(nextPhase&&cursor>=word(0x57c)){
   const first=sample(word(0x578),word(0x57a));
   memory[base+0x5a7]=first;memory[base+0x5a8]=first;memory[base+0x5a6]=0;
   put(0x57e,word(0x578)+1);repeat();
  }else{
   const decoded=stepMs91TandyDifferentialSample(before,nextPhase?sample(cursor,segment):undefined);
   memory[base+0x5a6]=decoded.state.phase;memory[base+0x5a7]=decoded.state.packed;memory[base+0x5a8]=decoded.state.accumulator;memory[base+0x587]=decoded.state.lastOutput;
   if(decoded.consumed)put(0x57e,cursor+1);writes.push(...decoded.writes);
  }
 }
 return finish();
}
