import {findOriginalResource} from './find-original-resource.ts';
import {copyOriginalResourceString} from './initialize-car-resource.ts';
import {drawOriginalShadowText} from './shadow-text-memory.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
/** Original165FD..16654 seeking message on the retained race surface. */
export function drawOriginalReplayWait(m:Uint8Array,d:number,display?:{shadowText(text:number,x:number,y:number,colour:number,shadow:number):number},address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),word=(base:number,at:number)=>v.getUint16(base+(at&65535),true),scratch=0xee82;
 m[d+scratch]=m[d+address(0xaa6e)];for(let i=0;i<3;i++)m[d+scratch+1+i]=m[d+0x31e1+i];
 const found=findOriginalResource(m,d,word(d,address(0x8fbe)),word(d,address(0x8fc0)),scratch,true)!;
 copyOriginalResourceString(m,d,address(0xa9f4),found.offset,found.segment);
 const font=word(d,0x4dd2)*16;let width=0;
 for(let i=0;i<65536;i++){const code=m[d+((address(0xa9f4)+i)&65535)];if(!code)break;const glyph=word(font,22+code*2);if(glyph)width=(width+(m[font+20]?m[font+glyph]:word(font,16)))&65535;}
 const x=Math.trunc(((320-width)<<16>>16)/2)&65535,bounds=display?display.shadowText(address(0xa9f4),x,100,word(d,0x4e8a),0):drawOriginalShadowText(m,d,address(0xa9f4),x,100,word(d,0x4e8a),0),destination=word(d,address(0x9acc));
 combineOriginalRectangles(m,d,destination,bounds,destination,address);
}
