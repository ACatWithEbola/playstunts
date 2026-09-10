import {prepareOriginalLine} from './prepare-original-line.ts';
import {rasterCockpitLine} from './cockpit-line-raster.ts';
/** Complete original 21D98 line operation through 251F4 rasterization.
 * Returns original pixel writes; framebuffer layout remains the caller's job.
 */
export function rasterOriginalLine(x0:number,y0:number,x1:number,y1:number,color:number,rectangle:readonly number[],before=new Uint8Array(28)){
 const initial=before.slice();new DataView(initial.buffer,initial.byteOffset,initial.byteLength).setUint16(16,color,true);
 const prepared=prepareOriginalLine(x0,y0,x1,y1,rectangle,initial);
 if(prepared.result!==0||new DataView(prepared.record.buffer,prepared.record.byteOffset,prepared.record.byteLength).getInt16(14,true)<=0)return [];
 return rasterCockpitLine(prepared.record);
}
