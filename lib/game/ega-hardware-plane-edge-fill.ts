import type {OriginalEgaFillOperation} from './ega-display-fill.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** EGA2C836/2C8BC/2C942 hardware clear/set/invert helpers. The
 * shifted path intentionally counts its interior bytes in DL, not DX. */
export function* fillOriginalHardwareEgaPlaneEdges(memory:Uint8Array,start:number,width:number,height:number,gap:number,shift:number,edges:number,operation:'clear'|'set'|'invert'):Generator<OriginalEgaFillOperation,void,number>{
 let target=u(start);width=u(width);height=u(height);gap=u(gap);shift=u(shift);
 const write=function*(at:number,bits:number,constant=false):Generator<OriginalEgaFillOperation,void,number>{const offset=u(at),value=yield {kind:'read',offset};yield {kind:'write',offset,value:constant?bits:operation==='clear'?value&bits:operation==='set'?value|bits:value^bits};};
 if(!shift){for(let row=0;row<Math.max(1,s(height));row++){const count=width||65536;for(let col=0;col<count;col++)yield* write(target+col,operation==='clear'?0:255,true);target=u(target+count+gap);}return;}
 let a=memory[0x209e0+u(0xbe4e+shift)],b=(~a)&255,count=width&255;
 if(operation==='clear'){if(!(edges&2))a=0;if(!(edges&1)){b=0;count=(count-1)&255;gap=u(gap+1);}}
 else if(operation==='set'){if(!(edges&2))b=255;if(!(edges&1)){a=255;count=(count-1)&255;gap=u(gap+1);}}
 else {if(!(edges&2))a=255;if(!(edges&1)){b=255;count=(count-1)&255;gap=u(gap+1);}}
 const previous=count<<24>>24;count=(count-1)&255;
 const branch=count===0?'two':previous<1?'one':'many',rows=branch==='many'?Math.max(1,s(height)):(height||65536);
 if(branch==='many')gap&=255;
 const first=operation==='clear'?a:b,last=operation==='clear'?b:a;
 for(let row=0;row<rows;row++){
  if(branch==='one'){yield* write(target,operation==='clear'?a|b:a&b);target=u(target+gap);}
  else if(branch==='two'){yield* write(target,first);target=u(target+1);yield* write(target,last);target=u(target+gap);}
  else {yield* write(target,first);target=u(target+1);for(let col=0;col<count;col++)yield* write(target+col,operation==='clear'?0:255,operation!=='invert');target=u(target+count);yield* write(target,last);target=u(target+gap);}
 }
}
