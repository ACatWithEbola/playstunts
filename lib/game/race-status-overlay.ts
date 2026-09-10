import {findOriginalResource} from './find-original-resource.ts';
import {copyOriginalResourceString} from './initialize-car-resource.ts';
import {drawOriginalShadowText} from './shadow-text-memory.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
import {drawOriginalRawBitmap} from './cockpit-bitmap-raster.ts';
import {originalGameTime} from './game-time-format.ts';
export interface OriginalRaceStatusDrawingHost {shadowText(text:number,x:number,y:number,colour:number,shadow:number):number;indexedSprite(pointer:{offset:number;segment:number},position:{x:number;y:number}):void;}
/** Original ED58..F15A status messages, route arrows and replay indicator.
 * Text remains in the original localized resource bank and shared buffer. */
export function drawOriginalRaceStatus(m:Uint8Array,d:number,bp:number,display?:OriginalRaceStatusDrawingHost,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(at:number,n:number)=>v.setUint16(d+u(at),u(n),true);
 for(let at=0;at<8;at+=2)set(address(0xa78e)+at,word(d,0x3312+at));
 const localized=(name:number)=>{
  const scratch=u(bp-0x16);m[d+scratch]=m[d+address(0xaa6e)];for(let i=0;i<3;i++)m[d+u(scratch+i+1)]=m[d+u(name+i)];
  const found=findOriginalResource(m,d,word(d,address(0x8fbe)),word(d,address(0x8fc0)),scratch,true)!;copyOriginalResourceString(m,d,address(0xa9f4),found.offset,found.segment);
 };
 const length=()=>{for(let i=0;i<65536;i++)if(!m[d+u(address(0xa9f4)+i)])return i;throw Error('Original status text has no bounded terminator');};
 const centered=()=>{
  const font=word(d,0x4dd2)*16;let width=0;
  for(let i=0;i<length();i++){const glyph=word(font,22+m[d+u(address(0xa9f4)+i)]*2);if(glyph)width=u(width+(m[font+20]?m[font+glyph]:word(font,16)));}
  return u(Math.trunc(s(320-width)/2));
 };
 const merge=(bounds:number)=>combineOriginalRectangles(m,d,address(0xa78e),bounds,address(0xa78e),address);
 const text=(y:number,x=centered())=>(display?display.shadowText(address(0xa9f4),x,y,word(d,0x4e8a),0):drawOriginalShadowText(m,d,address(0xa9f4),x,y,word(d,0x4e8a),0));
 const message=(name:number,y:number)=>{localized(name);merge(text(y));};
 const sprite=(at:number,x:number,y:number,bounds:number)=>{if(display)display.indexedSprite({offset:word(d,at),segment:word(d,at+2)},{x,y});else drawOriginalRawBitmap(m,word(d,at),word(d,at+2),x,y,'mapped');merge(bounds);};
 if(m[d+address(0x90f8)]){message(0x910,170);message(0x914,182);return address(0xa78e);}
 if(m[d+address(0xa3c2)]===0){
  if(!m[d+address(0x8eab)]){message(0x918,90);return address(0xa78e);}
  if(!m[d+address(0xa42a)]){message(0x91c,93);message(0x920,105);return address(0xa78e);}
  if(m[d+address(0xa9f0)]||m[d+0x12f]||m[d+address(0x8ce9)])return address(0xa78e);
  const primary=m[d+address(0x8f13)];
  if(primary===1||primary===2)sprite(primary===1?address(0xa3d8):address(0xa3dc),148,93,0x938);
  else if(primary===3){localized(0x924);merge(text(93));}
  m[d+address(0xa9f4)]=0;
  const secondary=m[d+address(0x8f14)];if(secondary===1){sprite(address(0xa3d8),68,113,0x940);localized(0x928);}else if(secondary===2){sprite(address(0xa3dc),228,113,0x948);localized(0x92c);}
  if(m[d+address(0xa9f4)])merge(text(116));
  if(m[d+address(0x8fbd)]){localized(0x930);const at=length(),time=originalGameTime(word(d,address(0xa7da)),false);for(let i=0;i<=time.length;i++)m[d+u(address(0xa9f4)+at+i)]=i===time.length?0:time.charCodeAt(i);merge(text(102));}
 }else if(m[d+address(0xa3c2)]===2&&word(d,address(0x8c26))%20<10){localized(0x934);merge(text(15,u(312-length()*8)));}
 return address(0xa78e);
}
