export interface EngineStartCall {kind:'instrument'|'note'|'volume';args:number[]}
/** Original 0x1931e, preserving instrument -> note -> initial silence order.
 * The callback executes each request synchronously; note returns its voice ID.
 */
export function startEngineAudio(before:Uint8Array,instrument:Uint8Array,dispatch:(call:EngineStartCall)=>number|void){
 if(before.length!==76)throw Error('Invalid original engine audio record');
 const record=before.slice(),v=new DataView(record.buffer),word=(o:number)=>v.getUint16(o,true);
 if(record[0]!==1||record[1]!==0)return record;
 dispatch({kind:'instrument',args:[word(2),word(0x24),word(0x26)]});
 if(!instrument[14])throw Error('Original engine pitch divide fault');
 const pitch=(Math.floor(word(0x1c)/instrument[14])+(instrument[15]<<4))&65535;
 v.setUint16(12,pitch,true);
 const voice=dispatch({kind:'note',args:[pitch,word(2)]});
 if(voice===undefined)throw Error('Original engine note allocation result is required');
 v.setUint16(18,voice,true);record[1]=1;record[26]=1;
 dispatch({kind:'volume',args:[word(2),0]});
 return record;
}
