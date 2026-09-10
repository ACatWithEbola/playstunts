export type OriginalRasterCall={address:number;args:number[];points?:number[][];presentationPoints?:number[][]};
export interface OriginalPrimitiveQueueLayout {count:number;used:number;flag:number;sentinel:number;last:number;links:number;records:number;colours:number;patterns:number;masks:number;baseColours:number;circle:number;wheel:number;point:number}
export const MCGA_PRIMITIVE_QUEUE:OriginalPrimitiveQueueLayout={count:0x8938,used:0x5f0a,flag:0x5588,sentinel:0x58b0,last:0x8a44,links:0x5590,records:0x58b2,colours:0x9c44,patterns:0xa32e,masks:0xa3a2,baseColours:0x9fe8,circle:0x24ea8,wheel:0x28ab2,point:0x2795a};
/** Original queue reset, 169E8..16A06. The sentinel is slot 400. */
export function resetOriginalPrimitiveQueue(memory:Uint8Array,d:number,layout:OriginalPrimitiveQueueLayout=MCGA_PRIMITIVE_QUEUE){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(const [offset,value] of [[layout.count,0],[layout.used,0],[layout.flag,0],[layout.sentinel,65535],[layout.last,400]])v.setUint16(d+offset,value,true);
}
/** Original 17BF6..17DF9 dispatch. Raster callbacks retain original argument order;
 * point arrays replace the original temporary near pointer, without altering geometry.
 */
export function drainOriginalPrimitiveQueue(memory:Uint8Array,d:number,draw:(call:OriginalRasterCall,index:number,counter:number)=>unknown,layout:OriginalPrimitiveQueueLayout=MCGA_PRIMITIVE_QUEUE){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(o:number)=>v.getUint16(d+(o&65535),true),signed=(n:number)=>(n<<16)>>16;
 const table=(pointer:number,index:number)=>signed(word(word(pointer)+index*2));
 let index=400;
 for(let counter=0,guard=0;counter<word(layout.count);counter=(counter+1)&65535){
  if(guard++>=65536)throw Error('Original primitive queue did not terminate');
  index=word(layout.links+index*2);
  const emit=(call:OriginalRasterCall)=>{const effect=draw(call,index,counter);if(effect&&typeof effect==='object'&&'counter' in effect&&'index' in effect&&typeof effect.counter==='number'&&typeof effect.index==='number'){counter=effect.counter&65535;index=effect.index&65535;}};
  const offset=word(layout.records+index*4),segment=word(layout.records+2+index*4),address=(n:number)=>(segment*16+((offset+n)&65535))&0xfffff;
  const byte=(n:number)=>memory[address(n)],coord=(n:number)=>v.getInt16(address(n),true);
  const material=byte(2),color=table(layout.colours,material),kind=byte(4),point=(i:number)=>[coord(6+i*4),coord(8+i*4)];
  if(kind===0){
   const count=(byte(3)<<24)>>24,points=Array.from({length:count},(_,i)=>point(i)),pattern=table(layout.patterns,material);
   if(pattern===0)emit({address:0x2372a,args:[color,count],points});
   else if(pattern===1){const mask=table(layout.masks,material);if(mask)emit({address:0x246bc,args:[mask,color,count],points});}
   else if(pattern===2)emit({address:0x21394,args:[table(layout.masks,material),table(layout.baseColours,material),color,count],points});
  }else if(kind===1)emit({address:0x21d98,args:[...point(0),...point(1),color]});
  else if(kind===2)emit({address:layout.circle,args:[...point(0),coord(10),color]});
  else if(kind===3)emit({address:layout.wheel,args:[0x2500,color,table(layout.colours,material+1),table(layout.colours,material+2)],points:Array.from({length:4},(_,i)=>point(i))});
  else if(kind===5)emit({address:layout.point,args:[...point(0),color]});
 }
 resetOriginalPrimitiveQueue(memory,d,layout);
}
