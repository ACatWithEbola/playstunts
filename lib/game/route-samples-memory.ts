import {TRACK_DISPLAY_LAYOUTS} from './track-display-layout.ts';
/** Native translation of the supplied route sampler at12d24/1328c..13567.
 * Reads far-pointer buffers, including the original signed-product wrap.
 * The caller supplies the actual analysis frame and populated route buffers.
 */
export function sampleOriginalRouteMemory(memory:Uint8Array,d:number,bp:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],layout=TRACK_DISPLAY_LAYOUTS[mode];
 const s16=(n:number)=>n<<16>>16,s8=(n:number)=>n<<24>>24;
 const address=(at:number)=>d+(at&65535),byte=(at:number)=>memory[address(at)];
 const word=(at:number)=>byte(at)|(byte(at+1)<<8),signed=(at:number)=>s16(word(at));
 const putByte=(at:number,value:number)=>{memory[address(at)]=value;};
 const putWord=(at:number,value:number)=>{putByte(at,value);putByte(at+1,value>>>8);};
 const far=(field:number,index:number)=>{const at=word(field)+index;const result=word(field+2)*16+(at&65535);if(result<0||result>=memory.length)throw Error('Original route sample pointer is outside memory');return result;};
 const readFar=(field:number,index:number)=>memory[far(field+high,index)];
 const writeFarWord=(field:number,index:number,value:number)=>{memory[far(field+high,index)]=value;memory[far(field+high,index+1)]=value>>>8;};
 const count=Math.min(Math.trunc(signed(0xa3e0+high)/3),64);
 putByte(0xa3a0+high,byte(0x8fba+high));putByte(0xa426+high,byte(0x8fbc+high));putByte(0xa77e+high,count);
 for(let i=0;i<901;i++)putByte(bp-0xad4+i,0);
 let written=0;
 for(let sample=0;sample<s8(byte(0xa77e+high));sample++){
  const denominator=s8(byte(0xa77e+high));putWord(bp-0xaf0,denominator);
  const index=Math.trunc(s16(word(0xa3e0+high)*sample)/denominator);putWord(bp-0xa,index);
  const column=readFar(0x9c4e,index),row=readFar(0x9fec,index);putByte(bp-0x3a4,column);putByte(bp-0x73a,row);
  const cell=s16(word(layout.address(0x89d4)+s8(row)*2)+s8(column)),visited=bp-0xad4+cell;putWord(bp-0xaec,visited);
  if(byte(visited))continue;putByte(visited,1);
  const tile=readFar(0x8fee,index),packed=readFar(0x9aea,index),recordIndex=packed&15;putWord(bp-0xc,tile);putByte(bp-0x742,recordIndex);putByte(bp-0xae4,packed&16);
  const records=word(0x2018+tile*14),record=records+recordIndex*14;putWord(bp-0x3ae,records);
  let vectors=word(record+8);if(packed&16){const alternate=word(record+10);putWord(bp-0xaea,alternate);if(alternate)vectors=alternate;}
  putWord(bp-0xade,vectors);putWord(bp-0xadc,d>>>4);putWord(bp-0xaf0,record);
  const vector=vectors+byte(record+5)*12,rotation=word(record+6),y=signed(vector+2);let x=signed(vector),z=signed(vector+4);
  if(rotation===256)[x,z]=[z,s16(-x)];else if(rotation===512){x=s16(-x);z=s16(-z);}else if(rotation===768)[x,z]=[s16(-z),x];
  putWord(bp-0xada,x);putWord(bp-0xad8,y);putWord(bp-0xad6,z);putWord(bp-8,rotation);
  const height=readFar(0x9ad0,cell)===6?450:0,size=byte(0x2023+tile*14);
  const worldX=word(layout.address(size&2?0x7378:0xa3e2)+s8(column)*2),worldZ=word(layout.address(size&1?0x7f9e:0xa796)+s8(row)*2);
  writeFarWord(0x9ac6,written*2,height);writeFarWord(0x9ae4,written*2,0);
  writeFarWord(0x8ff6,written*6+2,y+height);writeFarWord(0x8ff6,written*6+4,z+worldZ);writeFarWord(0x8ff6,written*6,x+worldX);written++;
 }
 putByte(0xa77e+high,written);
 const readOutput=(field:number,index:number)=>s16(readFar(field,index)|(readFar(field,index+1)<<8));
 return {positions:Array.from({length:written},(_,i)=>[readOutput(0x8ff6,i*6),readOutput(0x8ff6,i*6+2),readOutput(0x8ff6,i*6+4)]),heights:Array.from({length:written},(_,i)=>readOutput(0x9ac6,i*2)),flags:Array.from({length:written},(_,i)=>readOutput(0x9ae4,i*2))};
}
