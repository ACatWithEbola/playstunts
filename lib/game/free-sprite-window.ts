import {releaseResourcePages} from './release-resource-pages.ts';
/** Original242e0..2432f. Window descriptors are released in stack order;
 * the descriptor pointer retreats before the backing allocation is released. */
export function freeOriginalSpriteWindow(before:Uint8Array,d:number,cs:number,offset:number,segment:number,topOffset=0x6138){
 const view=new DataView(before.buffer,before.byteOffset,before.byteLength),base=(segment&65535)*16;
 const sourceOffset=view.getUint16(base+(offset&65535),true),sourceSegment=view.getUint16(base+((offset+2)&65535),true);
 const height=view.getUint16(sourceSegment*16+((sourceOffset+2)&65535),true),size=((height+15)*2)&65535;
 const top=view.getUint16(cs+topOffset,true);
 if(top!==((offset+size)&65535))return {memory:before,error:'window-order' as const};
 const memory=before.slice();new DataView(memory.buffer).setUint16(cs+topOffset,(top-size)&65535,true);
 return releaseResourcePages(memory,d,sourceSegment);
}
