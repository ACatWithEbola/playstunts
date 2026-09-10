import {initializeOriginalProjection} from './initialize-projection.ts';
/** Original13C31..13D1A with its13D8E..13DF0 layout branches. Retained locals
 * belong to the enclosing race frame and survive between displayed frames. */
export function prepareOriginalRaceViewport(memory:Uint8Array,d:number,framePointer:number,address:(mcga:number)=>number=n=>n){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),u=(n:number)=>n&65535,w=(at:number)=>v.getUint16(d+u(at),true),set=(at:number,n:number)=>v.setUint16(d+u(at),u(n),true),b=(at:number)=>memory[d+at];
 const fields=[[address(0xa3c2),address(0xa7d8)],[address(0x8002),address(0xaa5a)],[address(0xa77f),address(0x9be4)],[address(0x9aca),address(0x9c46)],[address(0xa9f0),address(0x70e8)]] as const;
 if(fields.some(([current,previous])=>b(current)!==b(previous))){
  for(const [current,previous] of fields)memory[d+previous]=b(current);
  set(address(0xa3c8),0);memory[d+u(framePointer-2)]=0;
  const replay=b(address(0xa3c2))===2&&!b(address(0x90f8))&&!!(b(address(0xa77f))||b(address(0x9aca)));memory[d+address(0xaae6)]=Number(replay);
  if(b(address(0x90f8)))set(address(0x9ac0),200);
  else if(b(address(0x8002))&&!b(address(0xa9f0))){
   set(address(0x9fe6),replay?151:200);memory[d+u(framePointer-2)]=1;set(address(0xa3c8),w(address(0xa7dc)));set(address(0x9ac0),w(address(0xa3ca)));
  }else set(address(0x9ac0),replay?151:200);
  if(w(framePointer-4)!==w(address(0xa3c8))||w(address(0x9000))!==w(address(0x9ac0))||w(framePointer-14)!==w(address(0x9fe6))){
   memory[d+address(0x9ab6)]=b(address(0xa003));initializeOriginalProjection(memory,d,35,Math.trunc((w(address(0x9ac0))<<16>>16)/6),320,w(address(0x9ac0)));
   set(address(0x7fea),w(address(0xa3c8)));set(address(0x7fec),w(address(0x9ac0)));set(framePointer-4,w(address(0xa3c8)));set(address(0x9000),w(address(0x9ac0)));set(framePointer-14,w(address(0x9fe6)));
  }
 }
 return {cockpit:memory[d+u(framePointer-2)]!==0,replayBar:b(address(0xaae6))!==0,rectangle:[w(address(0x7fe6)),w(address(0x7fe8)),w(address(0x7fea)),w(address(0x7fec))] as [number,number,number,number]};
}
