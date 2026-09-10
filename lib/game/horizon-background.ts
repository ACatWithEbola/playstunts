import {i16} from '../physics/math.ts';
export type OriginalBackgroundCommand={address:number;args:number[]};
/** Supplied DF2A..E09A: original panorama positioning and sky/ground rectangles. */
export function drawOriginalHorizonBackground(memory:Uint8Array,d:number,rectangle:readonly number[],heading:number,horizon:number,draw:(command:OriginalBackgroundCommand)=>void,address:(offset:number)=>number=n=>n){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),s=(o:number)=>v.getInt16(d+address(o),true),w=(o:number)=>v.getUint16(d+address(o),true),emit=(address:number,args:number[])=>draw({address,args:args.map(n=>n&65535)});
 const [left,right,top,bottom]=rectangle.map(i16),detail=memory[d+0x134];
 horizon=i16(horizon);
 let height=i16(horizon-top);if(detail!==4)height=i16(height-s(0x7fe4));
 if(i16(bottom-top)<height)height=i16(bottom-top);
 if(height>0){emit(0x250b3,[left,right,top,i16(top+height)]);emit(0x250f4,[w(0x9be2)]);}
 if(detail!==4&&top<horizon&&i16(horizon-s(0x9ae2))<=bottom){
  const x=((heading+512)&1023)-1024;
  emit(0x250b3,[left,right,top,bottom]);
  for(const [index,offset] of [[0,0],[1,320],[2,512],[3,832],[0,1024]])emit(0x259f0,[w(0xa390+index*4),w(0xa392+index*4),x+offset,i16(horizon-s(0x9b2c+index*2))]);
  // Only the optional wider display needs additional repeats of the same art.
  for(let cycle=1024;x+cycle+320<right;cycle+=1024)for(const [index,offset] of [[1,320],[2,512],[3,832],[0,1024]])emit(0x259f0,[w(0xa390+index*4),w(0xa392+index*4),x+cycle+offset,i16(horizon-s(0x9b2c+index*2))]);
 }
 const groundTop=top>horizon?top:horizon;
 if(i16(bottom-groundTop)>0){emit(0x250b3,[left,right,groundTop,bottom]);emit(0x250f4,[w(0x909e)]);}
}
