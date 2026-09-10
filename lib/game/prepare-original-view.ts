import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import {rotateZXY} from '../physics/rotation.ts';
import {vecTransform,type Vector} from '../physics/math.ts';
import {selectOriginalView} from './select-original-view.ts';
/** Supplied frame C279..C30B. Angles are original roll, pitch, heading words. */
export function prepareOriginalView(memory:Uint8Array,d:number,angles:Vector,rectangle:readonly number[],layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const heading=selectOriginalView(memory,d,angles,rectangle,0,layout);
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const lookahead=v.getUint16(d+0x872+((heading&1023)>>>7)*2,true);
 const backgroundMatrix=rotateZXY(angles[0],angles[1],0,true);
 const forward=vecTransform([0,0,1000],backgroundMatrix);
 return {heading,lookahead,backgroundMatrix,backgroundDirection:forward[2]>0?1:-1};
}
