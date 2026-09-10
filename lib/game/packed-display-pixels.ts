/** Scan out the original320x200 CGA mode4 or Tandy mode9 screen.
 * These bank/stride layouts match the supplied drivers' fixed screen windows.
 * The result contains hardware colour indices; palette state is external. */
export function originalPackedDisplayPixels(memory:Uint8Array,mode:'cga'|'tandy'){
 const banks=mode==='cga'?2:4,stride=mode==='cga'?80:160,units=mode==='cga'?4:2,bits=8/units,mask=(1<<bits)-1,pixels=new Uint8Array(64000);
 for(let y=0;y<200;y++){const row=0xb8000+(y%banks)*8192+Math.floor(y/banks)*stride;for(let x=0;x<320;x++)pixels[y*320+x]=(memory[row+Math.floor(x/units)]>>>((units-1-x%units)*bits))&mask;}
 return pixels;
}
