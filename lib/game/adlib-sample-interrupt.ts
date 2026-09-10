export interface AdlibSampleInterruptResult {state:Uint8Array;writes:number[][];chain:boolean;restoreTimer:boolean;acknowledge:boolean}
/** Original AD15 B10..BB8. State is the driver's retained BB9..BD4 block.
 * Sample reads and interrupt/PIT delivery remain explicit hardware boundaries. */
export function stepAdlibSampleInterrupt(before:Uint8Array,table:ArrayLike<number>,readSample:(offset:number,segment:number)=>number):AdlibSampleInterruptResult{
 if(before.length!==28||table.length!==256)throw Error('Invalid original AdLib sample state');
 const state=before.slice(),v=new DataView(state.buffer),word=(at:number)=>v.getUint16(at,true),put=(at:number,n:number)=>v.setUint16(at,n&65535,true),writes:number[][]=[];
 let chain=false,restoreTimer=false;
 if(word(8)){
  writes.push([0x40,table[readSample(word(12),word(14))&255]]);put(12,word(12)+1);put(8,word(8)-1);
 }else{
  if(word(18)){put(18,word(18)-1);if(!word(18)){
   restoreTimer=!!(word(20)|word(22));if(restoreTimer){put(20,0);put(22,0);}writes.push([0xb0,1]);put(16,1);
   return {state,writes,chain:false,restoreTimer,acknowledge:true};
  }}
  v.setUint32(12,v.getUint32(0,true),true);v.setUint32(8,v.getUint32(4,true),true);
 }
 put(26,word(26)-1);if(!word(26)){put(26,word(24));chain=true;}
 return {state,writes,chain,restoreTimer,acknowledge:!chain};
}
