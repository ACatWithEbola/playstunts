import {selectOriginalDisplayWindow} from './select-display-window.ts';
const u=(n:number)=>n&65535;
export type OriginalEgaPageOperation={kind:'port-read';port:number}|{kind:'port-byte'|'port-word';port:number;value:number}|{kind:'interrupts';enabled:boolean};
/** Original EGA294C0/294D1 display-page selection and retrace polling.
 * Port reads remain explicit: the host supplies display timing. */
export function* showOriginalEgaDisplayPage(memory:Uint8Array,d:number,flip=false):Generator<OriginalEgaPageOperation,void,number>{
 const c=0x209e0,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),put=(base:number,at:number,value:number)=>{memory[base+u(at)]=value&255;memory[base+u(at+1)]=(value>>>8)&255;};
 let port=word(0x400,0x63),page=word(d,0x5638);if(flip){page=(page&1)^1;put(d,0x5638,page);}
 const descriptor=word(c,0xc0b6+u(page*4)),start=word(c,descriptor),enabled=memory[d+0x5616];
 const fast=function*(address:number):Generator<OriginalEgaPageOperation,void,number>{const value=(address&0xff00)|12;yield {kind:'port-word',port,value};put(0x400,0x4e,value*2);memory[d+0x5616]=0;};
 if(!enabled){yield* fast(start);return;}
 const address=u(word(d,0x5618)+start),pan=memory[d+0x5617];
 if((address&255)===memory[d+0x5614]&&pan===memory[d+0x5615]){yield* fast(address);return;}
 memory[d+0x5614]=address&255;port=(port&0xff00)|((port+6)&255);
 if(!word(d,0x561a)){
  let count=0;while(!((yield {kind:'port-read',port})&8)){}while((yield {kind:'port-read',port})&8){}
  while(true){count=u(count+1);if(!count)break;if((yield {kind:'port-read',port})&8){while(true){count=u(count+1);if(!count||!((yield {kind:'port-read',port})&8))break;}break;}}
  put(d,0x561a,count>>>2);
 }
 while(!((yield {kind:'port-read',port})&8)){}
 let count=word(d,0x561a);do{yield {kind:'port-read',port};count=u(count-1);}while(count);
 port=(port&0xff00)|((port-6)&255);yield {kind:'interrupts',enabled:false};
 yield {kind:'port-word',port,value:(address&0xff00)|12};yield {kind:'port-word',port,value:((address&255)<<8)|13};yield {kind:'interrupts',enabled:true};
 const finalPan=memory[d+0x5617];if(finalPan!==memory[d+0x5615]){memory[d+0x5615]=finalPan;port=(port&0xff00)|((port+6)&255);while(!((yield {kind:'port-read',port})&8)){}
  yield {kind:'interrupts',enabled:false};port=(port&0xff00)|0xc0;yield {kind:'port-byte',port,value:0x33};yield {kind:'port-byte',port,value:finalPan};yield {kind:'interrupts',enabled:true};
 }
}
/** Original2959F selects the opposite page as the active drawing window. */
export function selectOriginalEgaBackPage(memory:Uint8Array,d:number){
 const c=0x209e0,word=(base:number,at:number)=>memory[base+u(at)]|(memory[base+u(at+1)]<<8),page=(word(d,0x5638)&1)^1;memory[d+0x563a]=page;memory[d+0x563b]=0;
 selectOriginalDisplayWindow(memory,'ega',word(c,0xc0b6+page*4),word(c,0xc0b8+page*4));
}
