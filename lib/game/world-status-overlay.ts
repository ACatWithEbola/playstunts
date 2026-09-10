import {drawOriginalRaceStatus,type OriginalRaceStatusDrawingHost} from './race-status-overlay.ts';
import {drawOriginalShadowText} from './shadow-text-memory.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
import {originalGameTime} from './game-time-format.ts';
/** Original DE31..DEA8 race clock and common status drawing. */
export function drawOriginalWorldStatus(m:Uint8Array,d:number,worldFramePointer:number,display?:OriginalRaceStatusDrawingHost,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(at:number,n:number)=>v.setUint16(d+u(at),u(n),true);
 const font=(at:number)=>{const seg=word(d,at+2);set(0x4dd2,seg);set(address(0xa004),word(seg*16,word(d,at)+14));};
 if(m[d+address(0xa3c2)]===0&&m[d+address(0x8eab)]){
  const text=originalGameTime(word(d,address(0xa034))+word(d,address(0x73b2)),false);for(let i=0;i<=text.length;i++)m[d+address(0xa9f4)+i]=i===text.length?0:text.charCodeAt(i);
  font(address(0xa006));const bounds=(display?display.shadowText(address(0xa9f4),140,u(word(d,address(0xa7dc))+2),word(d,0x4e8a),0):drawOriginalShadowText(m,d,address(0xa9f4),140,u(word(d,address(0xa7dc))+2),word(d,0x4e8a),0));combineOriginalRectangles(m,d,bounds,address(0x904a),address(0x904a),address);font(address(0x9ada));
 }
 const bounds=drawOriginalRaceStatus(m,d,u(worldFramePointer-0x14c),display,address);combineOriginalRectangles(m,d,bounds,address(0x901a),address(0x901a),address);
}
