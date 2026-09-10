import {findOriginalResource} from './find-original-resource.ts';
import {loadOriginalCgaPlanarColourTable,convertOriginalPlanarDisplayBank} from './convert-planar-display-bank.ts';
import {originalPlanarDisplayBankPages} from './packed-display-bank-pages.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {resizeResourcePages} from './resize-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {compactResidentResource} from './compact-resident-resource.ts';
/** Original CGA2DE34/TDY2D52E planar conversion. CGA reserves1000 extra
 * paragraphs for intermediate expansion and releases them before compaction. */
export function convertNativeResidentPlanarDisplayBank(before:Uint8Array,d:number,mode:'cga'|'tandy',sourceSegment:number,nameOffset:number){
 if(mode==='cga'){const palette=findOriginalResource(before,d,0,sourceSegment,0x52dc);if(palette)loadOriginalCgaPlanarColourTable(before,d,(palette.offset+16)&65535,palette.segment);}
 const pages=originalPlanarDisplayBankPages(before,mode,sourceSegment),allocated=allocateResourcePages(before,d,nameOffset,(pages+(mode==='cga'?1000:0))&65535);if(allocated.error)return {...allocated,resource:null};
 let memory=allocated.memory;new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint32(allocated.segment*16,pages*16,true);const converted=convertOriginalPlanarDisplayBank(memory,d,mode,sourceSegment,allocated.segment);
 if(mode==='cga'){const resized=resizeResourcePages(memory,d,allocated.segment,pages);memory=resized.memory;if(resized.error)return {...resized,resource:null};}
 const released=releaseResourcePages(memory,d,sourceSegment);if(released.error)return {...released,resource:null};const moved=compactResidentResource(released.memory,d,allocated.segment);if(moved.error)return {...moved,resource:null};return {...moved,resource:moved.memory.subarray(moved.segment*16,moved.segment*16+converted.bytesWritten),paragraphs:pages};
}
