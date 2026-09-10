import {allocateResourcePages} from './allocate-resource-pages.ts';
import {packOriginalBitmapBank} from './pack-bitmap-bank.ts';
import {resizeResourcePages} from './resize-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {compactResidentResource} from './compact-resident-resource.ts';
/** Original2c780..2c7d1 packs a resident bitmap bank, discards its source,
 * and moves the packed result down across the released allocation. */
export function packNativeResidentBitmapBank(before:Uint8Array,d:number,sourceSegment:number,sourceDescriptor:number,nameOffset:number,pack=packOriginalBitmapBank){
 const pages=new DataView(before.buffer,before.byteOffset,before.byteLength).getUint16(d+sourceDescriptor+12,true);
 const destination=allocateResourcePages(before,d,nameOffset,pages);
 if(destination.error)return {...destination,resource:null};
 const memory=destination.memory,result=pack(memory.subarray(sourceSegment*16),memory.subarray(destination.segment*16));
 const resized=resizeResourcePages(memory,d,destination.segment,result.paragraphs);
 if(resized.error)return {...destination,...resized,resource:null};
 const released=releaseResourcePages(resized.memory,d,sourceSegment);
 if(released.error)return {...destination,...released,resource:null};
 const moved=compactResidentResource(released.memory,d,destination.segment);
 if(moved.error)return {...moved,resource:null};
 return {...moved,resource:moved.memory.subarray(moved.segment*16,moved.segment*16+result.bytesWritten),paragraphs:result.paragraphs};
}
