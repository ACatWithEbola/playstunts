import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
export type OriginalDisplayClearOperation=OriginalEgaBitmapOperation|{kind:'write-word';offset:number;value:number};
/** Original whole-screen clear: packed modes retain the gaps between banks;
 * EGA writes all64KiB with controller write-mode2 and restores mode0. */
export function* clearOriginalDisplay(memory:Uint8Array,mode:'cga'|'tandy'|'ega',pattern:number):Generator<OriginalDisplayClearOperation,void,number>{
 pattern&=65535;
 if(mode!=='ega'){for(let bank=0;bank<(mode==='cga'?2:4);bank++)for(let offset=0;offset<8000;offset+=2){const at=0xb8000+bank*8192+offset;memory[at]=pattern&255;memory[at+1]=pattern>>>8;}return;}
 for(const [port,value] of [[0x3ce,5],[0x3cf,2],[0x3c4,2],[0x3c5,15]])yield {kind:'port-byte',port,value};
 for(let offset=0;offset<65536;offset+=2)yield {kind:'write-word',offset,value:pattern};
 yield {kind:'port-byte',port:0x3ce,value:5};yield {kind:'port-byte',port:0x3cf,value:0};
}
