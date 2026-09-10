/** Original 0x19397 -> 0x29e64: request expiry on the next audio callback. */
export function stopEngineRuntime<T extends {car:Uint8Array;voices:Uint8Array[]}>(before:T){
 const car=before.car.slice(),voices=before.voices.map(v=>v.slice()),view=new DataView(car.buffer);
 if(car[0]===1&&car[1]===1){
  const voice=view.getUint16(0x12,true);
  if(!voices[voice])throw Error('Missing original engine voice to stop');
  new DataView(voices[voice].buffer).setUint32(12,1,true);
  view.setUint16(0x12,65535,true);car[1]=0;car[0x1a]=1;
 }
 return {...before,car,voices,writes:[] as number[][]};
}
