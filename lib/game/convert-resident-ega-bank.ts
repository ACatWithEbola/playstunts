import {findOriginalResource} from './find-original-resource.ts';
import {loadOriginalDisplayColourTables} from './display-colour-tables.ts';
import {originalEgaBitmapBankPages} from './ega-bitmap-bank-pages.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {convertOriginalEgaBitmapBank} from './convert-ega-bitmap-bank.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {compactResidentResource} from './compact-resident-resource.ts';
/** Original31192: use the bank's !eg0 table when present, allocate the
 * original estimate, convert, release its source and compact the result. */
export function convertNativeResidentEgaBitmapBank(before:Uint8Array,d:number,sourceSegment:number,nameOffset:number){
 const palette=findOriginalResource(before,d,0,sourceSegment,0x538e);
 if(palette)loadOriginalDisplayColourTables(before,d,'ega',(palette.offset+16)&65535,palette.segment);
 const pages=originalEgaBitmapBankPages(before,sourceSegment),allocated=allocateResourcePages(before,d,nameOffset,pages);
 if(allocated.error)return {...allocated,resource:null};
 const memory=allocated.memory,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);v.setUint32(allocated.segment*16,pages*16,true);
 const converted=convertOriginalEgaBitmapBank(memory,d,sourceSegment,allocated.segment),released=releaseResourcePages(memory,d,sourceSegment);
 if(released.error)return {...released,resource:null};
 const moved=compactResidentResource(released.memory,d,allocated.segment);if(moved.error)return {...moved,resource:null};
 return {...moved,resource:moved.memory.subarray(moved.segment*16,moved.segment*16+converted.bytesWritten),paragraphs:pages};
}
