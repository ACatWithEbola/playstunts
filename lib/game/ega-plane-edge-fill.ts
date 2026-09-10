const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** EGA2BC00/2BC66/2BCCC single-plane clear/set/invert helpers. The
 * shifted path intentionally counts its interior bytes in DL, not DX. */
export function fillOriginalEgaPlaneEdges(memory:Uint8Array,segment:number,start:number,width:number,height:number,gap:number,shift:number,edges:number,operation:'clear'|'set'|'invert'){
 const base=u(segment)*16;let target=u(start);width=u(width);height=u(height);gap=u(gap);shift=u(shift);
 const write=(at:number,bits:number)=>{const p=(base+u(at))&0xfffff;memory[p]=operation==='clear'?memory[p]&bits:operation==='set'?memory[p]|bits:memory[p]^bits;};
 if(!shift){for(let row=0;row<Math.max(1,s(height));row++){const count=operation==='invert'?(width||65536):width;for(let col=0;col<count;col++)write(target+col,operation==='clear'?0:255);target=u(target+count+gap);}return;}
 let a=memory[0x209e0+u(0xb218+shift)],b=(~a)&255,count=width&255;
 if(operation==='clear'){if(!(edges&2))a=0;if(!(edges&1)){b=0;count=(count-1)&255;gap=u(gap+1);}}
 else if(operation==='set'){if(!(edges&2))b=255;if(!(edges&1)){a=255;count=(count-1)&255;gap=u(gap+1);}}
 else {if(!(edges&2))a=255;if(!(edges&1)){b=255;count=(count-1)&255;gap=u(gap+1);}}
 const previous=count<<24>>24;count=(count-1)&255;
 const branch=count===0?'two':previous<1?'one':'many',rows=branch==='many'?Math.max(1,s(height)):(height||65536);
 const first=operation==='clear'?a:b,last=operation==='clear'?b:a;
 for(let row=0;row<rows;row++){
  if(branch==='one'){write(target,operation==='clear'?a|b:a&b);target=u(target+gap);}
  else if(branch==='two'){write(target,first);target=u(target+1);write(target,last);target=u(target+gap);}
  else {write(target,first);target=u(target+1);for(let col=0;col<count;col++)write(target+col,operation==='clear'?0:255);target=u(target+count);write(target,last);target=u(target+gap);}
 }
}
