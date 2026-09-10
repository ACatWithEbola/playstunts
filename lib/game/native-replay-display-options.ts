export interface NativeReplayDisplayHost {
 memory():Uint8Array;
 dialog(resource:string,mode:number,selected:number,border:number,disabled:number[]):Promise<number>;
 changeGraphics():Promise<void>;
}
/** Original16438..164ea. Disabled state belongs to the original dialog;
 * this caller preserves its byte-sized response and direct flag updates. */
export async function runNativeReplayDisplayOptions(host:NativeReplayDisplayHost,d:number){
 const m=host.memory(),disabled=[0,0,0,0,m[d+0x8fc8]===0?1:0];
 const selected=(await host.dialog('emdo',2,0,new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x4ec2,true),disabled))<<24>>24;
 const current=host.memory();
 switch(selected){
  case 0:current[d+0x8002]^=1;break;
  case 1:current[d+0xa77f]^=1;break;
  case 2:current[d+0x12f]=(current[d+0x12f]+1)&255;if(current[d+0x12f]===4)current[d+0x12f]=0;break;
  case 3:await host.changeGraphics();break;
  case 4:current[d+0xa9f0]^=1;break;
 }
}
