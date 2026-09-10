import {buildOriginalFilePath} from './original-file-path.ts';
import {loadNativeRawResource,type NativeRawResourceHost} from './load-raw-resource.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {originalHighScoreTrackMatches,originalHighScoreEligibility} from './high-score-eligibility.ts';
import {createOriginalEmptyHighScores} from './high-score-empty.ts';
export interface AllocatedHighScoreHost extends NativeRawResourceHost {
 insertTrackDisk():Promise<number>;
 writeFile(nameOffset:number,bytes:Uint8Array):Promise<number>;
}
/** Original605B..616A with3D5C's fixed high-score buffer. Disk reads retain
 * adjacent bytes on a short file, as the original DOS service does. The
 * temporary saved track is discarded without caching after its901-byte check. */
export async function prepareAllocatedHighScores(host:AllocatedHighScoreHost,d:number,bp:number,retainedDI?:number){
 const view=()=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+(at&65535),true),set=(at:number,value:number)=>view().setUint16(d+(at&65535),value&65535,true);
 const pointer=(at:number)=>word(at)+word(at+2)*16;
 // 607F -> 1BCF8 -> 22D33 places the allocator frame at outer BP-C4.
 const loadTrack=async()=>{const resource=await loadNativeRawResource(host,d,0x937a,false,{bp:(bp-0xc4)&65535,di:retainedDI});set(bp-0x4a,resource?.offset??0);set(bp-0x48,resource?.segment??0);return resource;};
 host.memory()[d+((bp-0x6e)&65535)]=0;
 buildOriginalFilePath(host.memory(),d,0x98,0x8fcf,0x4ab,0x937a,(bp-0xb0)&65535);
 let saved=await loadTrack();if(!saved&&await host.insertTrackDisk())saved=await loadTrack();
 let status=255;
 if(saved){
  const memory=host.memory(),at=saved.segment*16+saved.offset;
  status=originalHighScoreTrackMatches(memory.subarray(pointer(0x9356),pointer(0x9356)+1802),memory.subarray(at,at+1802))?0:255;
  const released=releaseResourcePages(memory,d,saved.segment);if(released.error)throw Error('Original saved-track release failed');host.writeMemory(released.memory);
 }
 if(status===0){
  const scoreAddress=pointer(0x92fc),scoreBP=(bp-0xaa)&65535;
  // 60E3..6102 leaves DI=901 after a matching track; 3D62 saves it
  // immediately below the score-loader locals, inside the later entry record.
  set(scoreBP-0x3c,901);
  host.memory()[d+0x8fea]=255;for(let i=0;i<7;i++)set(0xa780+i*2,i);set(scoreBP-0x3a,7);
  buildOriginalFilePath(host.memory(),d,0x98,0x8fcf,0x29e,0x937a,(scoreBP-0x4c)&65535);
  host.memory()[d+0x135]=1;const bytes=await host.readFile(0x937a,false);host.memory()[d+0x135]=0;
  if(bytes){host.memory().set(bytes,scoreAddress);set(scoreBP-4,word(0x92fc));set(scoreBP-2,word(0x92fe));}
  else{
   set(scoreBP-4,0);set(scoreBP-2,0);
   const empty=createOriginalEmptyHighScores();host.memory().set(empty,scoreAddress);host.memory().set(empty.subarray(0,52),d+((scoreBP-0x38)&65535));
   const result=await host.writeFile(0x937a,empty);set(scoreBP-0x3a,result);if(result)status=255;
  }
 }
 const eligibility=originalHighScoreEligibility(status,word(0x89a0),host.memory()[d+0x8018],view().getUint16(pointer(0x92fc)+362,true),word(bp-0x88));
 host.memory()[d+((bp-0x6e)&65535)]=eligibility.status;set(bp-0x88,eligibility.candidateTime);
 return eligibility;
}
