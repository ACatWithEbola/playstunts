import type {Shape} from './types.ts';
/** Stable key shared by source submissions and the optional scene placements. */
export function upgradedSubmissionKey(descriptor:number,position:readonly number[],heading:number,paint:number){return [descriptor,...position.map(n=>n<<16>>16),heading&1023,paint].join('/');}
export function sourceSubmissionKey(record:readonly number[],camera:readonly number[]){
 const word=(i:number)=>record[i*2]|record[i*2+1]<<8;
 return upgradedSubmissionKey(word(3),[0,1,2].map(i=>(word(i)<<16>>16)+camera[i]),word(7),record[19]);
}
/** Read the original cloud bank without copying or modifying the live memory. */
export function readUpgradedShape(memory:Uint8Array,descriptor:number):Shape{
 const d=0x2d1a0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 const address=(at:number,offset=0)=>(word(at+2)*16+((word(at)+offset)&65535))&0xfffff;
 const paintCount=memory[d+descriptor+8],vertices=Array.from({length:word(descriptor)},(_,i)=>[0,1,2].map(axis=>v.getInt16(address(descriptor+2,i*6+axis*2),true)));
 const primitives:Shape['primitives']=[];let offset=0;
 while(memory[address(descriptor+10,offset)]){const at=address(descriptor+10,offset),type=memory[at],count=memory[d+0x3270+type];
  primitives.push({type,flags:memory[at+1],materials:Array.from(memory.subarray(at+2,at+2+paintCount)),indices:Array.from(memory.subarray(at+2+paintCount,at+2+paintCount+count))});offset+=2+paintCount+count;
 }
 return {vertices,primitives,paintCount};
}
