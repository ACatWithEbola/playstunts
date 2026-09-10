import {findOriginalResource} from './find-original-resource.ts';
import {initializeOriginalCarSimulation} from './initialize-car-simulation.ts';
/** Original1ae10 copies the first byte before testing the next byte. An empty
 * resource string therefore does not behave like a conventional strcpy. */
export function copyOriginalResourceString(memory:Uint8Array,d:number,destination:number,offset:number,segment:number){
 const base=(segment&65535)*16;
 for(let i=0;i<65536;i++){
  memory[d+(destination&65535)]=memory[base+(offset&65535)];destination=(destination+1)&65535;offset=(offset+1)&65535;
  if(!memory[base+offset]){memory[d+destination]=0;return;}
 }
 throw Error('Original car resource string has no bounded terminator');
}
/** OriginalBA5C..BB85: required SIMD and car-name lookup, forward simulation
 * copy, owner table initialization, then original name copying. */
export function initializeOriginalCarResource(memory:Uint8Array,d:number,offset:number,segment:number,opponent=false,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const simulation=findOriginalResource(memory,d,offset,segment,opponent?0x610:0x606,true)!;
 const destination=d+high+(opponent?0x9c52:0xa46a),view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),base=simulation.segment*16;
 for(let i=0;i<776;i+=2)view.setUint16(destination+i,view.getUint16(base+((simulation.offset+i)&65535),true),true);
 initializeOriginalCarSimulation(memory,d,memory.subarray(destination,destination+776),opponent,mode);
 const name=findOriginalResource(memory,d,offset,segment,opponent?0x615:0x60b,true)!;
 copyOriginalResourceString(memory,d,high+(opponent?0x8019:0x8a12),name.offset,name.segment);
}
