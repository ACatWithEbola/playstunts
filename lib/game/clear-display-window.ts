import type {OriginalDisplayClearOperation} from './clear-display.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original active-window clears, including EGA's whole-stride fast path and
 * its hardware zero-width partial-window one-byte behavior. */
export function* clearOriginalDisplayWindow(memory:Uint8Array,mode:'cga'|'tandy'|'ega',colour:number):Generator<OriginalDisplayClearOperation,void,number>{
 const c=0x209e0,block=mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,word=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),left=word(block+10),width=u(word(block+12)-left),top=word(block+14),height=u(word(block+16)-top),stride=word(block+18),start=u(word(word(block+8)+top*2)+left);
 if(mode!=='ega'){
  const base=word(block)*16;for(let row=0;row<Math.max(1,s(height));row++){const at=u(word(word(block+8)+(top+row)*2)+left),value=(top+row)&1?colour&255:(colour>>>8)&255;for(let x=0;x<width;x++)memory[(base+u(at+x))&0xfffff]=value;}return;
 }
 const full=width===stride,hardware=word(block)===0xa000,total=u(width*height),gap=u(stride-width);
 if(!hardware){for(let plane=0;plane<4;plane++){const segment=word(block+plane*2);if(!segment)continue;const base=segment*16,value=colour&(1<<plane)?255:0;let at=start;
   if(full){for(let n=0;n<(total>>>1);n++){const address=(base+at)&0xfffff;memory[address]=value;memory[(address+1)&0xfffff]=value;at=u(at+2);}if(total&1)memory[(base+at)&0xfffff]=value;}
   else for(let row=0;row<Math.max(1,s(height));row++){for(let x=0;x<width;x++){memory[(base+at)&0xfffff]=value;at=u(at+1);}at=u(at+gap);}
  }return;
 }
 for(const [port,value] of [[0x3ce,5],[0x3cf,2],[0x3c4,2],[0x3c5,15]])yield {kind:'port-byte',port,value};
 let at=start;const byte=colour&255,value=byte*257;
 if(full){for(let n=0;n<(total>>>1);n++){yield {kind:'write-word',offset:at,value};at=u(at+2);}if(total&1)yield {kind:'write',offset:at,value:byte};}
 else for(let row=0;row<Math.max(1,s(height));row++){
  if(width<2){yield {kind:'write',offset:at,value:byte};at=u(at+1);}
  else{for(let n=0;n<(width>>>1);n++){yield {kind:'write-word',offset:at,value};at=u(at+2);}if(width&1){yield {kind:'write',offset:at,value:byte};at=u(at+1);}}
  at=u(at+gap);
 }
 yield {kind:'port-byte',port:0x3ce,value:5};yield {kind:'port-byte',port:0x3cf,value:0};
}
