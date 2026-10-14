import assert from 'node:assert/strict';
import {drawOriginalEgaScaledSprite} from '../lib/game/ega-scaled-sprite.ts';
import {createEgaPlanarMemory} from '../lib/game/ega-planar-memory.ts';
import {executeOriginalEgaDisplay} from '../lib/game/execute-ega-display.ts';

const d=0x32090,c=0x209e0,segments=[0x5000,0x6000,0x7000,0x8000],source=0x90000;
let cases=0,visibleCases=0;
for(const scale of [2,64,128,255,256,384,512,768])for(const x of [0,7,8,169])for(const y of [0,80])for(const clip of [[0,320,0,200],[169,174,75,86]]){
 const software=new Uint8Array(0x100000),v=new DataView(software.buffer),put=(at:number,n:number)=>v.setUint16(at,n,true);
 segments.forEach((segment,plane)=>{put(c+0x9114+plane*2,segment);software.fill((plane*53+37)&255,segment*16,segment*16+65536);});
 put(c+0x911c,0x9300);for(let row=0;row<200;row++)put(c+0x9300+row*2,row*40);
 for(const [at,n] of [[0x912c,clip[0]],[0x912e,clip[1]],[0x9122,clip[2]],[0x9124,clip[3]]])put(c+at,n);
 for(let colour=0;colour<256;colour++){software[d+0x53f2+colour]=colour&15;software[d+0x5502+colour]=(colour^7)&15;}
 [12,9,6,4,0,17].forEach((n,i)=>put(source+i*2,n));
 for(let row=0;row<9;row++)for(let col=0;col<12;col++)software[source+16+row*12+col]=(row+col)%3===0?255:(row*5+col)&15;
 const sprite=software.slice(source,source+16+108),initial=segments.map(segment=>software.slice(segment*16,segment*16+65536));
 const hardware=software.slice(),hv=new DataView(hardware.buffer);hv.setUint16(c+0x9114,0xa000,true);
 const graphics=new Uint8Array(9);graphics[8]=255;
 const aperture=createEgaPlanarMemory({planes:initial,latches:new Uint8Array(4),mapMask:15,graphics});
 executeOriginalEgaDisplay(aperture,drawOriginalEgaScaledSprite(hardware,d,0,source/16,scale,{x,y}));
 const program=drawOriginalEgaScaledSprite(software,d,0,source/16,scale,{x,y});assert.equal(program.next().done,true,'Software destination must not emit hardware operations');
 const expected=aperture.snapshot().planes;
 for(let plane=0;plane<4;plane++){
  const actual=software.subarray(segments[plane]*16,segments[plane]*16+65536),differences=Array.from(actual.keys()).filter(i=>actual[i]!==expected[plane][i]);
  assert.equal(differences.length,0,`scale${scale} x${x} y${y} clip${clip} plane${plane}: first differences ${differences.slice(0,8)}`);
  if(actual.some((value,i)=>value!==initial[plane][i]))visibleCases++;
 }
 assert.deepEqual(software.slice(source,source+16+108),sprite);cases++;
}
assert.ok(visibleCases>0);
console.log(`EGA software scaled sprites match hardware across${cases} scaling/alignment/clipping cases, including transparency, dithering, edge bits and unchanged source assets`);
