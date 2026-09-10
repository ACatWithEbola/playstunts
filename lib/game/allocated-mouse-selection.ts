/** Original1C0EC..1C140 with the regular driver, preserving the cursor stack
 * and callback suspension while the original mouse information is visible. */
export async function selectAllocatedMouseControl(host:{memory():Uint8Array;audio(operation:'pause-audio'|'resume-audio'):void;dialog(resource:string,mode:number,selected:number,border:number):Promise<number>;hideCursor():void},d:number){
 pushOriginalCursorState(host.memory(),d);let m=host.memory();
 new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4090,1,true);host.audio('pause-audio');
 host.memory()[d+0x12c]=1;
 await host.dialog('emou',4,0,new DataView(host.memory().buffer,host.memory().byteOffset,host.memory().byteLength).getUint16(d+0x4ec2,true));
 host.audio('resume-audio');m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4090,0,true);
 popOriginalCursorState(m,d,host.hideCursor);
}
export function pushOriginalCursorState(m:Uint8Array,d:number){
 const depth=m[d+0x33aa]<<24>>24;m[d+((0xa31c+depth)&65535)]=m[d+0x131];m[d+((0xa324+depth)&65535)]=m[d+0x132];m[d+0x33aa]++;
}
export function popOriginalCursorState(m:Uint8Array,d:number,hideCursor:()=>void){
 if(m[d+0x33aa]){
  m[d+0x33aa]--;const depth=m[d+0x33aa]<<24>>24;m[d+0x131]=m[d+((0xa31c+depth)&65535)];m[d+0x132]=m[d+((0xa324+depth)&65535)];
  if(!m[d+0x132]){m[d+0x131]=0;hideCursor();}
 }
}
/** Original1C2AE..1C315 graphics-detail selector on the same modal services. */
export async function selectAllocatedGraphicsLevel(host:Parameters<typeof selectAllocatedMouseControl>[0],d:number){
 pushOriginalCursorState(host.memory(),d);let m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4090,1,true);host.audio('pause-audio');
 m=host.memory();const selected=(await host.dialog('emrl',2,m[d+0x134],new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x4ec0,true)))&255;
 if(selected!==255)host.memory()[d+0x134]=selected;
 host.audio('resume-audio');m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4090,0,true);popOriginalCursorState(m,d,host.hideCursor);
}
