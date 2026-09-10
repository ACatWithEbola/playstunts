import {drawOriginalCrashOverlay,type OriginalCrashOverlayDrawingHost} from './crash-overlay-memory.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
/** Original DD98..DE30: only the internal camera draws the focused car's
 * windshield/water state, using that car's own crash timestamp. */
export function drawOriginalViewCrash(m:Uint8Array,d:number,rectangle:number,worldFramePointer:number,display?:OriginalCrashOverlayDrawingHost,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(at:number)=>v.getUint16(d+u(at),true);
 const top=word(rectangle+4),bottom=word(rectangle+6),cs=0x209e0;
 if(display)display.clip(0,320,top,bottom);else for(const [at,n] of [[0x5dae,0],[0x5da0,0],[0x5db0,320],[0x5da2,320],[0x5da4,top],[0x5da6,bottom]])v.setUint16(cs+at,n,true);
 if(m[d+0x12f])return;
 const other=!!m[d+address(0xa9f0)],kind=m[d+(other?address(0x8da1):address(0x8ce9))];if(kind!==1&&kind!==2)return;
 const elapsed=u(word(address(0x8c26))-word(other?address(0x8c2e):address(0x8c2c))),bounds=drawOriginalCrashOverlay(m,d,kind,elapsed,top,u(bottom-top),u(worldFramePointer-0x152),display,address);
 combineOriginalRectangles(m,d,bounds,address(0x901a),address(0x901a),address);
}
