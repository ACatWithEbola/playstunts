/** MS91 DD6E..DDB4 and E01A..E062 descriptor routing. This helper uses
 * original MS91 layout only; the legacy display bridge must map its inputs. */
export function configureMs91ModelRegion(memory:Uint8Array,d:number,bp:number,kind:'first'|'second'){
 if(d<0||!Number.isInteger(d)||d+65536>memory.length)throw Error('Original data segment is outside memory');
 const u=(n:number)=>n&65535,word=(at:number)=>memory[d+u(at)]|memory[d+u(at+1)]<<8,set=(at:number,n:number)=>{memory[d+u(at)]=n&255;memory[d+u(at+1)]=(n>>>8)&255;};
 const descriptor=word(0xb138);
 if(word(0x9690)){set(descriptor+8,kind==='first'?0x9728:0x9730);memory[d+u(descriptor+18)]=12;return;}
 if(memory[d+(kind==='first'?0x93bb:0x948b)]===1){
  const destination=u(bp-(kind==='first'?0x6a:0x8e));
  // Sequential MOVSW semantics, including possible aliased near pointers.
  for(let i=0;i<4;i++)set(destination+i*2,word(0x339a+i*2));
  set(descriptor+8,destination);memory[d+u(descriptor+18)]=12;
 }else memory[d+u(descriptor+18)]=4;
}
/** Original frame-begin returns08 when slow-video management is active; scene
 * submissions OR that bit into their existing flags. Retain geometry/pointers. */
export function ms91RedrawModelRecord(record:readonly number[],enabled:boolean){
 if(record.length!==20)throw Error('Original model record requires twenty bytes');
 const copy=Array.from(record);if(enabled)copy[18]=(copy[18]|8)&255;return copy;
}
