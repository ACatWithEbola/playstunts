import {loadCompleteNativeGameResource} from './load-complete-game-resource.ts';
import {loadNativeResource,type NativeResourceFileHost} from './load-native-resource.ts';
import {initializeOriginalRenderingState} from './initialize-rendering-state.ts';
import {allocateOriginalRenderQueue} from './allocate-render-queue.ts';
/** Original28AD..28F5: MAIN, the two fonts, default font selection and the
 * persistent render queue and rotation tables. stackPointer is the caller's SP before its pushes. */
export async function loadNativeCommonGameResources(host:NativeResourceFileHost,d:number,stackPointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],u=(n:number)=>n&65535;
 const save=(at:number,pointer:{offset:number;segment:number})=>{const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);v.setUint16(d+at+high,pointer.offset,true);v.setUint16(d+at+high+2,pointer.segment,true);};
 save(0x9300,await loadCompleteNativeGameResource(host,d,0x42,u(stackPointer-8)));
 const normal=await loadNativeResource(host,d,0,0x47,u(stackPointer-10),mode);if(!normal)throw Error('Original default font loading was canceled');save(0x9ada,normal);
 const alternate=await loadNativeResource(host,d,0,0x53,u(stackPointer-10),mode);if(!alternate)throw Error('Original alternate font loading was canceled');save(0x9336,alternate);
 const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);
 v.setUint16(d+0x4dd2,normal.segment,true);v.setUint16(d+0xa004+high,v.getUint16(normal.segment*16+u(normal.offset+14),true),true);
 const queue=allocateOriginalRenderQueue(m,d,mode);host.writeMemory(queue.memory);if(queue.error)throw Error('Original render queue allocation failed: '+queue.error);
 initializeOriginalRenderingState(host.memory(),d,mode);
}
