export interface NativeRaceCycleHost {
 memory():Uint8Array;showWaiting():void;race():Promise<void>;results():Promise<number>;
}
/** Original2C8C..2CBF. Results can reopen the recording or start a fresh race
 * without releasing the outer session's saved configuration and checkpoints. */
export async function runNativeRaceCycle(host:NativeRaceCycleHost,d:number,entry:'fresh'|'replay'|'resume'){
 for(;;){
  const m=host.memory();
  if(entry==='replay')m[d+0x8018]=4;
  else if(entry==='fresh')new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x8fd8,0,true);
  host.showWaiting();await host.race();
  if(host.memory()[d+0x90f8]||!host.memory()[d+0x8018])return;
  const action=(await host.results())&255;
  if(action===0)entry='replay';else if(action===1)entry='fresh';else return;
 }
}
