export interface EngineStartCall {kind:'instrument'|'note'|'volume';args:number[]}
/** Original 0x1931e, preserving instrument -> note -> initial silence order.
 * The callback executes each request synchronously; note returns its voice ID.
 */
export function startEngineAudio(before:Uint8Array,instrument:Uint8Array,dispatch:(call:EngineStartCall)=>number|void){
 const program=runEngineAudioStart(before,instrument);let step=program.next();while(!step.done)step=program.next(dispatch(step.value.call));return step.value;
}
export function* runEngineAudioStart(before:Uint8Array,instrument:Uint8Array){
 if(before.length!==76)throw Error('Invalid original engine audio record');
 const record=before.slice(),v=new DataView(record.buffer),word=(o:number)=>v.getUint16(o,true);
 if(record[0]!==1||record[1]!==0)return record;
 yield {call:{kind:'instrument' as const,args:[word(2),word(0x24),word(0x26)]},record};
 if(!instrument[14])throw Error('Original engine pitch divide fault');
 const pitch=(Math.floor(word(0x1c)/instrument[14])+(instrument[15]<<4))&65535;
 v.setUint16(12,pitch,true);
 const voice:number|void=yield {call:{kind:'note' as const,args:[pitch,word(2)]},record};
 if(voice===undefined)throw Error('Original engine note allocation result is required');
 v.setUint16(18,voice,true);record[1]=1;record[26]=1;
 yield {call:{kind:'volume' as const,args:[word(2),0]},record};
 return record;
}
