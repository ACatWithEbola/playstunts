/** Original 0x1964a startup effect wrapper. The original diagnostic print is
 * excluded from audio state; no engine-stop call precedes effect allocation.
 */
export function engineStartupAudio(before:Uint8Array,start:(args:number[])=>number){
 if(before.length!==76)throw Error('Invalid original car audio record');
 const car=before.slice(),v=new DataView(car.buffer);
 const handle=start([v.getUint16(0x2c,true),v.getUint16(0x2e,true),65535,64,v.getUint16(4,true)>>>4]);
 v.setUint16(20,handle,true);car[26]=1;car[27]=1;
 return car;
}
