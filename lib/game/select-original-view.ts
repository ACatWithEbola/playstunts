import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import {rotateZXY} from '../physics/rotation.ts';
import {i16,intAtan2,vecTransform,type Vector} from '../physics/math.ts';
import {resetOriginalPrimitiveQueue} from './drain-primitive-queue.ts';
/** Supplied executable 16A08..16A9F: view transform, queue reset, clip and heading. */
export function selectOriginalView(memory:Uint8Array,d:number,angles:Vector,rectangle:readonly number[],parameter:number,layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const [z,x,y]=angles.map(i16),matrix=rotateZXY(z,x,y,true);
 matrix.forEach((n,i)=>v.setInt16(d+layout.address(0xaa5c)+i*2,n,true));
 resetOriginalPrimitiveQueue(memory,d,layout.queue);
 rectangle.forEach((n,i)=>v.setInt16(d+layout.address(0x556a)+i*2,n,true));
 v.setUint16(d+layout.address(0x558a),parameter,true);
 const forward=vecTransform([0,0,10000],rotateZXY(i16(-z),i16(-x),i16(-y)));
 return intAtan2(forward[0],forward[2])&1023;
}
