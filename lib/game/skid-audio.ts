/** Original 0x197da/0x19835/0x19890. Callbacks retain the original argument
 * words and request order; effect allocation and stopping execute separately.
 */
export function skidAudio(before:Uint8Array,variant:1|2|'stop',start:(args:number[])=>number,stop:(effect:number)=>void){
 if(before.length!==76)throw Error('Invalid original car audio record');
 const record=before.slice(),view=new DataView(record.buffer);
 const read=(offset:number)=>view.getUint16(offset,true);
 const previous=read(0x16);
 if(variant==='stop'){
  stop(previous);view.setUint16(0x16,65535,true);
 }else{
  if(previous!==65535)stop(previous);
  const offset=variant===1?0x3c:0x40;
  const effect=start([read(offset),read(offset+2),65535,64,read(4)>>>4]);
  view.setUint16(0x16,effect,true);record[0x1a]=1;
 }
 return record;
}
