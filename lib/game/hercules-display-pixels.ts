/** Hercules monochrome scanout of live display RAM. The supplied CGA /h
 * initializer selects page1, 40 sixteen-dot columns and 100 three-raster rows.
 * Addressing follows the HGC bank layout documented in the Amstrad PC1640
 * technical reference1.11.7. Geometry/address stepping also follows the
 * DOSBox Staging Hercules scanout model (vga_draw.cpp). This is digital
 * scanout only; CRT phosphor, border timing and interlaced output are absent. */
export function originalHerculesDisplayPixels(memory:Uint8Array,crtc:ArrayLike<number>,modeControl:number,displayStart=0){
 if(crtc.length<10||(crtc[8]&3)!==2)throw Error('Unverified Hercules CRTC profile');
 const width=crtc[1]*16,rasters=(crtc[9]&31)+1,height=crtc[6]*rasters;
 if(width<1||width>4096||height<1||height>4096)throw RangeError('Invalid Hercules scanout geometry');
 const pixels=new Uint8Array(width*height);
 if(!(modeControl&8))return {width,height,pixels};
 if(!(modeControl&2))throw Error('Hercules text scanout is separate');
 const base=modeControl&128?0xb8000:0xb0000,rowBytes=width/8;
 if(memory.length<base+32768)throw RangeError('Hercules display RAM is missing');
 for(let y=0;y<height;y++){
  const bank=(y%rasters)&3,row=displayStart*2+Math.floor(y/rasters)*rowBytes;
  for(let x=0;x<width;x++)pixels[y*width+x]=(memory[base+bank*8192+((row+(x>>>3))&8191)]>>>(7-(x&7)))&1;
 }
 return {width,height,pixels};
}
