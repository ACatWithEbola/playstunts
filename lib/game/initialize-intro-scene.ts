import {initializeCar} from '../physics/initialize-car.ts';
import {i16,type Vector} from '../physics/math.ts';
export const originalIntroPath=[0,1,2,3,4,1,2,3,4,1,2,3,4,0,1,2,3,0];
export const originalIntroRoute={tiles:[7,6,8,9,7],columns:[1,0,0,1,1],routeRows:[28,28,29,29,28],directions:[0,0,0,0,0]};
/** Supplied B1B6..B3AA. Source intro route and Countach initialization.
 * The caller loads CARCOUN into the opponent SIMD allocation first.
 */
export function initializeOriginalIntroScene(memory:Uint8Array,d:number,lookup:(entry:number,point:number)=>{midpoint:Vector;first:Vector;second:Vector;alternate:number;side:number}){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number,n:number)=>v.setUint16(d+at,n,true);
 memory[d+0x8eab]=2;word(0x9ad6,0);word(0x9ad8,0x2cbf);memory[d+0x8fba]=1;memory[d+0x8fbc]=28;
 for(const [pointer,values] of [[0x8fee,originalIntroRoute.tiles],[0x9c4e,originalIntroRoute.columns],[0x9fec,originalIntroRoute.routeRows],[0x9aea,originalIntroRoute.directions]] as const){const base=v.getUint16(d+pointer+2,true)*16,offset=v.getUint16(d+pointer,true);values.forEach((value,index)=>{memory[base+((offset+index)&65535)]=value;});}
 const base=v.getUint16(d+0x7ff6,true)*16,offset=v.getUint16(d+0x7ff4,true);originalIntroPath.forEach((entry,index)=>v.setUint16(base+((offset+index*2)&65535),entry,true));
 memory[d+0x9362]=200;
 memory.set(initializeCar(memory.subarray(d+0x8cf0,d+0x8da8),memory.subarray(d+0x9c52,d+0x9f5a),1,[96000,0,i16(v.getInt16(d+0x7fd6,true)+302)*64],0),d+0x8cf0);
 const point=memory[d+0x8da6];memory[d+0x8da6]=(point+1)&255;
 const routeIndex=v.getUint16(d+0x8d3a,true),entry=v.getUint16(base+((offset+routeIndex*2)&65535),true),target=lookup(entry,point);
 [...target.midpoint,...target.first,...target.second].forEach((n,i)=>v.setInt16(d+0x8d7c+i*2,n,true));
 v.setInt16(d+0x8d8e,target.alternate,true);memory[d+0x8eaf]=target.side;
 return {path:originalIntroPath,route:originalIntroRoute};
}
