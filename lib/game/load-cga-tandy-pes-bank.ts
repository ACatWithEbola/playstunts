import {loadAllocatedPackedResource} from './load-allocated-packed-resource.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {unflipOriginalEgaBitmapBank} from './unflip-ega-bitmap-bank.ts';
import {convertNativeResidentPlanarDisplayBank} from './convert-resident-planar-display-bank.ts';
/** CGA2DD1C/TDY2D3EC: PES decode,2002-paragraph transpose scratch, then
 * mode-specific conversion. The transpose code matches EGA except its DS. */
export function loadNativeCgaTandyPesBank(before:Uint8Array,d:number,mode:'cga'|'tandy',nameOffset:number,bytes:Uint8Array){
 const loaded=loadAllocatedPackedResource(before,d,nameOffset,bytes);if(loaded.error||!loaded.resource)return loaded;
 const scratch=allocateResourcePages(loaded.memory,d,mode==='cga'?0x52c3:0x53fb,0x7d2);if(scratch.error)return {...loaded,memory:scratch.memory,error:scratch.error,resource:null};
 unflipOriginalEgaBitmapBank(scratch.memory,loaded.segment,scratch.segment);const released=releaseResourcePages(scratch.memory,d,scratch.segment);if(released.error)return {...loaded,...released,resource:null};
 return convertNativeResidentPlanarDisplayBank(released.memory,d,mode,loaded.segment,nameOffset);
}
