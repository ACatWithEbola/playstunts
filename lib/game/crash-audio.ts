/** Original audio_function2_wrap at loaded 0x1971e and stop helper 0x19397.
 * The audio allocator/driver remains a separate dependency. Preserve request
 * order: allocate crash effect first, then stop an active engine voice.
 */
export function crashAudio(before:Uint8Array,start:(args:number[])=>number,stop:(voice:number)=>void){
 if(before.length!==0x4c)throw Error('Original audio timer record must contain 76 bytes');
 const record=before.slice(),view=new DataView(record.buffer);
 const read=(offset:number)=>view.getUint16(offset,true);
 const voice=start([read(0x38),read(0x3a),65535,100,read(4)>>>4]);
 view.setUint16(0x14,voice,true);record[0x1a]=1;
 if(record[0]===1 && record[1]===1){stop(read(0x12));view.setUint16(0x12,65535,true);record[1]=0;}
 return record;
}
