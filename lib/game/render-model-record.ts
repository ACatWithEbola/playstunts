/** Decode the original 20-byte model submission without losing its signed
 * coordinates or retained rendering fields. Names are matched to source assets.
 */
export function decodeOriginalModelRecord(record:readonly number[],models:Readonly<Record<string,string>>){
 if(record.length!==20)throw Error('Original model submission must contain 20 bytes');
 const bytes=Uint8Array.from(record),v=new DataView(bytes.buffer),pointer=v.getUint16(6,true);
 const shape=pointer===0?null:models[String(pointer)];
 if(shape===undefined)throw Error(`Unmapped original model pointer ${pointer.toString(16)}`);
 return {shape,position:[v.getInt16(0,true),v.getInt16(2,true),v.getInt16(4,true)],rotation:[v.getInt16(10,true),v.getInt16(12,true),v.getInt16(14,true)],renderRegion:v.getUint16(8,true),field16:v.getUint16(16,true),flags:bytes[18],paint:bytes[19]};
}
