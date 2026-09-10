import type {CockpitFrameHost} from './cockpit-frame.ts';
import {findOriginalResource} from './find-original-resource.ts';
/** Original14a60 mode1: roof, dashboard, centered wheel and per-buffer caches. */
export function drawOriginalCockpitBase(host:CockpitFrameHost,d:number,address:(mcga:number)=>number=n=>n){
 const u=(n:number)=>n&65535,word=(base:number,at:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(base+u(at),true);};
 const lookup=(name:number,required=false)=>findOriginalResource(host.memory(),d,word(d,address(0x5436)),word(d,address(0x5438)),name,required);
 host.selectBackBuffer();
 if(lookup(0x3111)){const roof=lookup(0x3116,true)!;host.drawPackedUnclipped(roof.offset,roof.segment,word(roof.segment*16,roof.offset+8),word(roof.segment*16,roof.offset+10));}
 const dash=lookup(0x311b,true)!;host.drawPackedDefault(dash.offset,dash.segment);host.drawPackedDefault(word(d,address(0x546e)),word(d,address(0x5470)));host.selectFrontBuffer();
 const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength),i=m[d+address(0x897c)]<<24>>24;
 for(const at of [address(0x8ff2),address(0x54b4),address(0x54aa)])m[d+u(at+i)]=0;
 v.setUint16(d+u(address(0x54b0)+i*2),0,true);
 for(const at of [address(0x54ba),address(0x5432),address(0x5426)])v.setUint16(d+u(at+i*2),65535,true);
}
