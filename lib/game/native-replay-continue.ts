export interface NativeReplayContinueHost {
 memory():Uint8Array;
 /** Legacy host name: source1B21E releases pending input; the browser must await it. */
 resetCounter():void|Promise<void>;initialize(mode:number):void;
 dialog(resource:string,mode:number,selected:number,border:number):Promise<number>;
 selectControl(mode:number,selected:number,value:number):void;resetMouse(mode:number):void;
}
/** Original16102..161e6 restart/continue actions. A replay branch retains
 * continuation flag2; continuing at the recorded end can retain eligibility. */
export async function continueNativeReplay(host:NativeReplayContinueHost,d:number,restart:boolean){
 let m=host.memory();
 if(restart){
  await host.resetCounter();host.initialize(-1);m=host.memory();
  const v=new DataView(m.buffer,m.byteOffset,m.byteLength);
  v.setUint16(d+0x73b2,0,true);v.setUint16(d+0x8fd8,0,true);m[d+0xa34e]=0;m[d+0x8018]=1;
 }else{
  let flags:number;
  const v=new DataView(m.buffer,m.byteOffset,m.byteLength);
  if(m[d+0x8018]&2)flags=3;
  else if(v.getUint16(d+0x8fd8,true)===v.getUint16(d+0x73b2,true))flags=1;
  else{
   const selected=await host.dialog('econ',2,0,v.getUint16(d+0x4ec0,true));
   if((selected<<16>>16)<1)return false;
   flags=3;
  }
  m=host.memory();m[d+0x8018]=flags;
  const current=new DataView(m.buffer,m.byteOffset,m.byteLength),frame=current.getUint16(d+0x8c26,true);
  current.setUint16(d+0x73b2,frame,true);current.setUint16(d+0x8fd8,frame,true);
 }
 m[d+0x8002]=1;m[d+0x8fbd]=0;m[d+0xa9f0]=0;m[d+0xa3c2]=0;m[d+0x12f]=0;m[d+0x8eac]=0;
 new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x8c1e,0,true);m[d+0x8ffe]=0;
 host.selectControl(2,3,0);m=host.memory();m[d+0x9aca]=0;
 host.resetMouse(m[d+0x12c]<<24>>24);await host.resetCounter();host.memory()[d+0x132]=0;
 return true;
}
