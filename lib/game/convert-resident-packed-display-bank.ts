import {findOriginalResource} from './find-original-resource.ts';
import {loadOriginalDisplayColourTables} from './display-colour-tables.ts';
import {originalPackedDisplayBankPages} from './packed-display-bank-pages.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {convertOriginalPackedDisplayBank} from './convert-packed-display-bank.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {compactResidentResource} from './compact-resident-resource.ts';
/** Original CGA2DEEC/TDY2D5A6 indexed-bank conversion and compaction. */
export function convertNativeResidentPackedDisplayBank(before:Uint8Array,d:number,mode:'cga'|'tandy',sourceSegment:number,nameOffset:number){
 const palette=findOriginalResource(before,d,0,sourceSegment,mode==='cga'?0x52e1:0x5418);if(palette)loadOriginalDisplayColourTables(before,d,mode,(palette.offset+16)&65535,palette.segment);
 const pages=originalPackedDisplayBankPages(before,mode,sourceSegment),allocated=allocateResourcePages(before,d,nameOffset,pages);if(allocated.error)return {...allocated,resource:null};
 const memory=allocated.memory,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);v.setUint32(allocated.segment*16,pages*16,true);
 const converted=convertOriginalPackedDisplayBank(memory,d,mode,sourceSegment,allocated.segment),released=releaseResourcePages(memory,d,sourceSegment);if(released.error)return {...released,resource:null};
 const moved=compactResidentResource(released.memory,d,allocated.segment);if(moved.error)return {...moved,resource:null};return {...moved,resource:moved.memory.subarray(moved.segment*16,moved.segment*16+converted.bytesWritten),paragraphs:pages};
}
