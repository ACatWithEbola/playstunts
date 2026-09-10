import {findOriginalResource} from './find-original-resource.ts';
/** Original285e6: resolve four-byte names until the list's zero terminator. */
export function initializeOriginalResourceList(memory:Uint8Array,d:number,offset:number,segment:number,name:number,destination:number){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 while(memory[d+(name&65535)]){
  const resource=findOriginalResource(memory,d,offset,segment,name,true)!;
  view.setUint16(d+(destination&65535),resource.offset,true);
  view.setUint16(d+((destination+2)&65535),resource.segment,true);
  name=(name+4)&65535;destination=(destination+4)&65535;
 }
}
