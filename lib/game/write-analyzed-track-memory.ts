import {sampleOriginalRouteMemory} from './route-samples-memory.ts';
import {scanStart} from '../physics/start-scan.ts';
import type {analyzeRoute} from '../physics/route-analysis.ts';
/** Store verified analysis outputs in the original caller-owned allocations.
 * Allocation/free and temporary resource memory remain owned by the loader.
 */
export function writeAnalyzedTrackMemory(before:Uint8Array,dataSegment:number,raw:number[],analysis:ReturnType<typeof analyzeRoute>,mode:'mcga'|'cga'|'tandy'|'ega'='mcga',samplingFrame?:number){
 if(dataSegment<0||dataSegment+65536>before.length)throw Error('Original data segment is outside memory');
 if(!analysis.route||analysis.route.error||!analysis.metadata||(!analysis.samples&&samplingFrame===undefined))throw Error('A successful original track analysis is required');
 const memory=before.slice(),v=new DataView(memory.buffer),d=dataSegment;
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],middle=mode==='ega'?0x460:high;
 const write=(field:number,values:readonly number[],size:1|2)=>{
  field+=field===0x73d2||field===0x7f9a||field===0x70e0?middle:high;
  const offset=v.getUint16(d+field,true),segment=v.getUint16(d+field+2,true);
  values.forEach((value,index)=>{const address=segment*16+((offset+index*size)&65535);if(address<0||address+size>memory.length)throw Error('Original track allocation is outside memory');if(size===1)memory[address]=value;else v.setUint16(address,value,true);});
 };
 const {route,metadata,samples}=analysis,scan=scanStart(raw);
 write(0x9356,scan.track,1);write(0x9ad0,raw.slice(901,1801),1);
 write(0x73d2,Array(901).fill(65535),2);write(0x7f9a,Array(901).fill(65535),2);
 write(0x73d2,route.primary,2);write(0x7f9a,route.secondary,2);
 for(const [field,values] of [[0x9c4e,route.columns],[0x9fec,route.routeRows],[0x9aea,route.directions],[0x8fee,route.tiles]] as const)write(field,values,1);
 write(0xa3c4,metadata.headings,2);write(0xa9ec,metadata.types,1);write(0x70e0,metadata.positions.flat(),2);write(0xa466,metadata.cells,1);
 if(samples){write(0x9ac6,samples.heights,2);write(0x9ae4,samples.flags,2);write(0x8ff6,samples.positions.flat(),2);}
 v.setUint16(d+0xa3e0+high,route.count,true);memory[d+0x9c47+high]=metadata.headings.length;if(samples)memory[d+0xa77e+high]=samples.positions.length;
 scan.start.forEach((n,i)=>memory[d+0x8fba+high+i]=n);v.setInt16(d+0x9b2a+high,scan.heading,true);
 if(analysis.location){memory[d+0xa3a0+high]=analysis.location[0];memory[d+0xa426+high]=analysis.location[1];}
 // Deferred sampling uses the caller's actual frame and populated far buffers.
 if(!samples&&samplingFrame!==undefined){
  write(0xa466,[...metadata.cells,255],1);
  // Original1278B clears this separate traversal-visited array.12D78 marks
  // each accepted node. Wrapped sampler indices can read beyond its own
  // visited array into these retained traversal bytes on very long tracks.
  for(let i=0;i<901;i++)memory[d+((samplingFrame-0x738+i)&65535)]=0;
  for(let i=0;i<route.count;i++){
   const cell=v.getUint16(d+0xa350+high+route.routeRows[i]*2,true)+route.columns[i];
   memory[d+((samplingFrame-0x738+cell)&65535)]=1;
  }
  sampleOriginalRouteMemory(memory,d,samplingFrame,mode);
 }
 return {memory,raw:[...scan.track,...raw.slice(900)]};
}
