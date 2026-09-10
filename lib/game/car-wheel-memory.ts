import {updateOriginalCarWheels} from './car-wheel-geometry.ts';
import type {Vector} from '../physics/math.ts';
/** Apply the original wheel call to caller-owned memory. Far offsets wrap
 * within their segment, and only vertex/cache words written by the routine change.
 */
export function updateOriginalCarWheelMemory(memory:Uint8Array,d:number,args:readonly number[]){
 if(args.length!==7)throw Error('Original wheel call requires seven argument words');
 const [offset,segment,steering,suspensionAt,cacheAt,baseAt,centersAt]=args;
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),at=(base:number,off:number)=>base+(off&65535);
 const vectors=(base:number,off:number,count:number)=>Array.from({length:count},(_,i)=>[0,1,2].map(axis=>view.getInt16(at(base,off+i*6+axis*2),true)) as Vector);
 const words=(off:number,count:number)=>Array.from({length:count},(_,i)=>view.getInt16(at(d,off+i*2),true));
 const before=vectors(segment*16,offset,24),cache=words(cacheAt,5);
 const result=updateOriginalCarWheels(before,steering,words(suspensionAt,4),cache,vectors(d,baseAt,24),vectors(d,centersAt,2));
 for(let i=0;i<24;i++)for(let axis=0;axis<3;axis++)if(before[i][axis]!==result.vertices[i][axis])view.setInt16(at(segment*16,offset+i*6+axis*2),result.vertices[i][axis],true);
 for(let i=0;i<5;i++)if(cache[i]!==result.cache[i])view.setInt16(at(d,cacheAt+i*2),result.cache[i],true);
}
